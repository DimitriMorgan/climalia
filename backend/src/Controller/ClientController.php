<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\ClientInput;
use App\Dto\ContactInput;
use App\Entity\Client;
use App\Entity\User;
use App\Enum\UserRole;
use App\Repository\ClientRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

/**
 * Gestion des entreprises clientes et de leurs contacts (comptes CLIENT) par
 * l'admin administratif. Accès restreint à ROLE_ADMIN (sauf /options, ouvert
 * aux employés pour la pré-affectation — cf. security.yaml).
 */
#[Route('/api/clients', name: 'api_clients_')]
final class ClientController extends AbstractController
{
    public function __construct(
        private readonly ClientRepository $clients,
        private readonly UserRepository $users,
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $hasher,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $companies = $this->clients->findBy([], ['name' => 'ASC']);

        return new JsonResponse(array_map($this->serialize(...), $companies));
    }

    /**
     * Liste légère (id + libellé entreprise) pour le sélecteur de pré-affectation
     * côté employé. Accessible aux employés, contrairement à la liste complète.
     */
    #[Route('/options', name: 'options', methods: ['GET'])]
    public function options(): JsonResponse
    {
        $companies = $this->clients->findBy([], ['name' => 'ASC']);

        return new JsonResponse(array_map(
            static fn (Client $c): array => ['id' => $c->getId()->toRfc4122(), 'label' => $c->getName()],
            $companies,
        ));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(#[MapRequestPayload] ClientInput $input): JsonResponse
    {
        if (
            $input->contactEmail === null || $input->contactFirstName === null
            || $input->contactLastName === null || $input->password === null || $input->password === ''
        ) {
            return $this->violation('contact', 'Un contact (email, prénom, nom, mot de passe) est requis à la création.');
        }
        if ($this->users->findByEmail($input->contactEmail) instanceof User) {
            return $this->violation('contactEmail', 'Un compte existe déjà avec cet email.');
        }

        $company = new Client($input->name, $input->segment, $input->region);
        $this->em->persist($company);
        $this->em->persist($this->makeContact(
            $company,
            $input->contactEmail,
            $input->contactFirstName,
            $input->contactLastName,
            $input->password,
        ));
        $this->em->flush();

        return new JsonResponse($this->serialize($company), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(string $id, #[MapRequestPayload] ClientInput $input): JsonResponse
    {
        $company = $this->findCompanyOr404($id);
        $company->setName($input->name);
        $company->setSegment($input->segment);
        $company->setRegion($input->region);
        $this->em->flush();

        return new JsonResponse($this->serialize($company));
    }

    #[Route('/{id}/contacts', name: 'add_contact', methods: ['POST'])]
    public function addContact(string $id, #[MapRequestPayload] ContactInput $input): JsonResponse
    {
        $company = $this->findCompanyOr404($id);
        if ($input->password === null || $input->password === '') {
            return $this->violation('password', 'Mot de passe requis.');
        }
        if ($this->users->findByEmail($input->email) instanceof User) {
            return $this->violation('email', 'Un compte existe déjà avec cet email.');
        }

        $this->em->persist($this->makeContact($company, $input->email, $input->firstName, $input->lastName, $input->password));
        $this->em->flush();

        return new JsonResponse($this->serialize($company), Response::HTTP_CREATED);
    }

    private function makeContact(Client $company, string $email, string $firstName, string $lastName, string $password): User
    {
        $user = new User($email, 'placeholder', UserRole::CLIENT, $firstName, $lastName, $company->getRegion(), $company);
        $user->setPasswordHash($this->hasher->hashPassword($user, $password));

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Client $c): array
    {
        $contacts = $this->users->findBy(['client' => $c], ['createdAt' => 'ASC']);

        return [
            'id' => $c->getId()->toRfc4122(),
            'name' => $c->getName(),
            'segment' => $c->getSegment()->value,
            'region' => $c->getRegion(),
            'contacts' => array_map(static fn (User $u): array => [
                'id' => $u->getId()->toRfc4122(),
                'email' => $u->getEmail(),
                'firstName' => $u->getFirstName(),
                'lastName' => $u->getLastName(),
                'active' => $u->isActive(),
                'notifyOnNewDocument' => $u->isNotifyOnNewDocument(),
            ], $contacts),
        ];
    }

    private function violation(string $path, string $message): JsonResponse
    {
        return new JsonResponse(
            ['message' => $message, 'violations' => [['propertyPath' => $path, 'message' => $message]]],
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }

    private function findCompanyOr404(string $id): Client
    {
        if (!Uuid::isValid($id)) {
            throw new NotFoundHttpException('Invalid client id.');
        }
        $company = $this->clients->find(Uuid::fromString($id));
        if (!$company instanceof Client) {
            throw new NotFoundHttpException('Client not found.');
        }

        return $company;
    }
}
