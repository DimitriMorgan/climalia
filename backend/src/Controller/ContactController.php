<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\ContactRequestInput;
use App\Entity\ContactRequest;
use App\Entity\User;
use App\Enum\ContactStatus;
use App\Repository\ContactRequestRepository;
use App\Service\ContactReplyMailer;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Uid\Uuid;

#[Route('/api/contact', name: 'api_contact_')]
final class ContactController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly RateLimiterFactoryInterface $contactLimiter,
        private readonly ContactRequestRepository $requests,
        private readonly ContactReplyMailer $replyMailer,
    ) {
    }

    #[Route('', name: 'submit', methods: ['POST'])]
    public function submit(
        Request $request,
        #[MapRequestPayload] ContactRequestInput $input,
    ): JsonResponse {
        $limiter = $this->contactLimiter->create($request->getClientIp() ?? 'anonymous');
        $limit = $limiter->consume();
        if (!$limit->isAccepted()) {
            throw new TooManyRequestsHttpException(
                $limit->getRetryAfter()->getTimestamp() - time(),
                'Too many contact requests. Please retry later.',
            );
        }

        $deadline = null;
        if (is_string($input->deadline) && $input->deadline !== '') {
            try {
                $deadline = new DateTimeImmutable($input->deadline);
            } catch (\Exception) {
                $deadline = null;
            }
        }

        $contact = new ContactRequest(
            $input->fullName,
            $input->email,
            $input->phone,
            $input->postalCode,
            $input->projectType,
            $input->message,
            $input->surface,
            $deadline,
        );

        $this->em->persist($contact);
        $this->em->flush();

        return new JsonResponse(
            ['id' => $contact->getId()->toRfc4122(), 'status' => $contact->getStatus()->value],
            Response::HTTP_CREATED,
        );
    }

    /**
     * Liste des demandes de devis pour la page de gestion admin
     * (ROLE_ADMIN — cf. security.yaml). Filtre optionnel par statut.
     */
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $status = ContactStatus::tryFrom((string) $request->query->get('status', ''));
        $rows = $this->requests->findBy(
            $status !== null ? ['status' => $status] : [],
            ['createdAt' => 'DESC'],
        );

        return new JsonResponse(array_map($this->serialize(...), $rows));
    }

    #[Route('/{id}', name: 'update_status', methods: ['PATCH'])]
    public function updateStatus(string $id, Request $request): JsonResponse
    {
        $contact = $this->findOr404($id);

        $decoded = json_decode($request->getContent(), true);
        $status = is_array($decoded) && isset($decoded['status']) && is_string($decoded['status'])
            ? ContactStatus::tryFrom($decoded['status'])
            : null;
        if ($status === null) {
            return new JsonResponse(
                ['message' => 'Statut invalide.', 'violations' => [['propertyPath' => 'status', 'message' => 'Statut invalide.']]],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $contact->setStatus($status);
        $this->em->flush();

        return new JsonResponse($this->serialize($contact));
    }

    /**
     * Réponse de l'admin à une demande de devis : e-mail au prospect
     * (Reply-To = l'admin qui répond), horodatage, statut NEW → CONTACTED.
     */
    #[Route('/{id}/reply', name: 'reply', methods: ['POST'])]
    public function reply(string $id, Request $request, #[CurrentUser] User $admin): JsonResponse
    {
        $contact = $this->findOr404($id);

        $decoded = json_decode($request->getContent(), true);
        $subject = is_array($decoded) && isset($decoded['subject']) && is_string($decoded['subject'])
            ? trim($decoded['subject'])
            : '';
        $message = is_array($decoded) && isset($decoded['message']) && is_string($decoded['message'])
            ? trim($decoded['message'])
            : '';

        $violations = [];
        if ($subject === '' || mb_strlen($subject) > 200) {
            $violations[] = ['propertyPath' => 'subject', 'message' => 'Objet requis (200 caractères max).'];
        }
        if ($message === '' || mb_strlen($message) > 10000) {
            $violations[] = ['propertyPath' => 'message', 'message' => 'Message requis (10 000 caractères max).'];
        }
        if ($violations !== []) {
            return new JsonResponse(
                ['message' => 'Validation échouée.', 'violations' => $violations],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $this->replyMailer->sendReply($contact, $subject, $message, $admin);
        $contact->markReplied();
        $this->em->flush();

        return new JsonResponse($this->serialize($contact));
    }

    private function findOr404(string $id): ContactRequest
    {
        if (!Uuid::isValid($id)) {
            throw new NotFoundHttpException('Invalid contact request id.');
        }
        $contact = $this->requests->find(Uuid::fromString($id));
        if (!$contact instanceof ContactRequest) {
            throw new NotFoundHttpException('Contact request not found.');
        }

        return $contact;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(ContactRequest $c): array
    {
        return [
            'id' => $c->getId()->toRfc4122(),
            'fullName' => $c->getFullName(),
            'email' => $c->getEmail(),
            'phone' => $c->getPhone(),
            'postalCode' => $c->getPostalCode(),
            'projectType' => $c->getProjectType()->value,
            'surface' => $c->getSurface(),
            'deadline' => $c->getDeadline()?->format('Y-m-d'),
            'message' => $c->getMessage(),
            'createdAt' => $c->getCreatedAt()->format(DATE_ATOM),
            'status' => $c->getStatus()->value,
            'repliedAt' => $c->getRepliedAt()?->format(DATE_ATOM),
        ];
    }
}
