<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/auth', name: 'api_auth_')]
final class AuthController extends AbstractController
{
    /**
     * Stub — handled by `json_login` on the api_login firewall.
     * Cette action n'est techniquement jamais exécutée (le firewall
     * intercepte la requête), mais on doit définir la route pour le router.
     */
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        // Si on tombe ici, c'est que le json_login n'a pas pu intercepter.
        throw new \LogicException('json_login should have handled this request.');
    }

    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        // JWT stateless : le client est responsable de jeter son token.
        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['error' => 'Unauthenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $client = $user->getClient();

        return new JsonResponse([
            'id' => $user->getId()->toRfc4122(),
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'role' => $user->getRoleEnum()->value,
            'region' => $user->getRegion(),
            'company' => $client?->getName(),
            'segment' => $client?->getSegment()->value,
        ]);
    }
}
