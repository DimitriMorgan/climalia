<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\UserInput;
use App\Entity\User;
use App\Enum\UserRole;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Uid\Uuid;

/**
 * Administration des comptes internes (salariés, éditeurs, admins, partenaires)
 * par l'admin administratif. Accès restreint à ROLE_ADMIN (cf. security.yaml).
 * Les comptes CLIENT (contacts d'entreprises) se gèrent via /api/clients.
 */
#[Route('/api/users', name: 'api_users_')]
final class UserController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $hasher,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $all = $this->users->findBy([], ['createdAt' => 'ASC']);

        return new JsonResponse(array_map($this->serialize(...), $all));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(#[MapRequestPayload] UserInput $input): JsonResponse
    {
        if ($input->role === UserRole::CLIENT) {
            return $this->violation('role', 'Les comptes clients se créent via la gestion des entreprises clientes.');
        }
        if ($input->password === null || $input->password === '') {
            return $this->violation('password', 'Mot de passe requis à la création.');
        }
        if ($this->users->findByEmail($input->email) instanceof User) {
            return $this->violation('email', 'Un compte existe déjà avec cet email.');
        }

        $user = new User(
            $input->email,
            'placeholder',
            $input->role,
            $input->firstName,
            $input->lastName,
            $this->normalizeRegion($input->region),
        );
        $user->setPasswordHash($this->hasher->hashPassword($user, $input->password));
        $this->em->persist($user);
        $this->em->flush();

        return new JsonResponse($this->serialize($user), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(string $id, #[MapRequestPayload] UserInput $input): JsonResponse
    {
        $user = $this->findOr404($id);

        if ($input->role === UserRole::CLIENT || $user->getRoleEnum() === UserRole::CLIENT) {
            // Le rattachement entreprise d'un contact CLIENT se gère via /api/clients ;
            // on n'autorise pas non plus à transformer un compte interne en CLIENT.
            if ($input->role !== $user->getRoleEnum()) {
                return $this->violation('role', 'Le rôle CLIENT ne peut pas être attribué ou retiré ici.');
            }
        }

        $existing = $this->users->findByEmail($input->email);
        if ($existing instanceof User && !$existing->getId()->equals($user->getId())) {
            return $this->violation('email', 'Un compte existe déjà avec cet email.');
        }

        $user->setEmail($input->email);
        $user->setFirstName($input->firstName);
        $user->setLastName($input->lastName);
        $user->setRoleEnum($input->role);
        $user->setRegion($this->normalizeRegion($input->region));
        if ($input->password !== null && $input->password !== '') {
            $user->setPasswordHash($this->hasher->hashPassword($user, $input->password));
        }
        $this->em->flush();

        return new JsonResponse($this->serialize($user));
    }

    /**
     * Mise à jour partielle des drapeaux d'un compte :
     *  - active : peut se connecter (bloqué au login ET sur les tokens déjà émis)
     *  - notifyOnNewDocument : reçoit les e-mails de notification (contacts clients)
     */
    #[Route('/{id}', name: 'flags', methods: ['PATCH'])]
    public function updateFlags(string $id, Request $request, #[CurrentUser] User $current): JsonResponse
    {
        $user = $this->findOr404($id);
        $decoded = json_decode($request->getContent(), true);
        if (!is_array($decoded)) {
            return $this->violation('body', 'Payload JSON attendu.');
        }

        if (array_key_exists('active', $decoded)) {
            if (!is_bool($decoded['active'])) {
                return $this->violation('active', 'Booléen attendu.');
            }
            if (!$decoded['active'] && $user->getId()->equals($current->getId())) {
                return $this->violation('active', 'Vous ne pouvez pas désactiver votre propre compte.');
            }
            $user->setActive($decoded['active']);
        }

        if (array_key_exists('notifyOnNewDocument', $decoded)) {
            if (!is_bool($decoded['notifyOnNewDocument'])) {
                return $this->violation('notifyOnNewDocument', 'Booléen attendu.');
            }
            $user->setNotifyOnNewDocument($decoded['notifyOnNewDocument']);
        }

        $this->em->flush();

        return new JsonResponse($this->serialize($user));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $id, #[CurrentUser] User $current): JsonResponse
    {
        $user = $this->findOr404($id);

        if ($user->getId()->equals($current->getId())) {
            return $this->violation('id', 'Vous ne pouvez pas supprimer votre propre compte.');
        }

        $this->em->remove($user);
        $this->em->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(User $u): array
    {
        $company = $u->getClient();

        return [
            'id' => $u->getId()->toRfc4122(),
            'email' => $u->getEmail(),
            'firstName' => $u->getFirstName(),
            'lastName' => $u->getLastName(),
            'role' => $u->getRoleEnum()->value,
            'region' => $u->getRegion(),
            'company' => $company !== null
                ? ['id' => $company->getId()->toRfc4122(), 'label' => $company->getName()]
                : null,
            'active' => $u->isActive(),
            'notifyOnNewDocument' => $u->isNotifyOnNewDocument(),
            'createdAt' => $u->getCreatedAt()->format(DATE_ATOM),
        ];
    }

    private function normalizeRegion(?string $region): ?string
    {
        if ($region === null) {
            return null;
        }
        $trimmed = trim($region);

        return $trimmed === '' ? null : $trimmed;
    }

    private function violation(string $path, string $message): JsonResponse
    {
        return new JsonResponse(
            ['message' => $message, 'violations' => [['propertyPath' => $path, 'message' => $message]]],
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }

    private function findOr404(string $id): User
    {
        if (!Uuid::isValid($id)) {
            throw new NotFoundHttpException('Invalid user id.');
        }
        $user = $this->users->find(Uuid::fromString($id));
        if (!$user instanceof User) {
            throw new NotFoundHttpException('User not found.');
        }

        return $user;
    }
}
