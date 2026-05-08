<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\ContactRequestInput;
use App\Entity\ContactRequest;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/contact', name: 'api_contact_')]
final class ContactController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly RateLimiterFactoryInterface $contactLimiter,
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
}
