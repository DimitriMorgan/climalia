<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;

final class AuthControllerTest extends ApiTestCase
{
    #[Test]
    public function login_success_returns_jwt(): void
    {
        $this->client->jsonRequest('POST', '/api/auth/login', [
            'email' => 'admin@climalia.fr',
            'password' => 'demo',
        ]);

        self::assertResponseStatusCodeSame(Response::HTTP_OK);
        $data = $this->decodeJson();
        self::assertArrayHasKey('token', $data);
        self::assertNotEmpty($data['token']);
    }

    #[Test]
    public function login_with_bad_credentials_returns_401(): void
    {
        $this->client->jsonRequest('POST', '/api/auth/login', [
            'email' => 'admin@climalia.fr',
            'password' => 'wrong-password',
        ]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    #[Test]
    public function me_with_valid_token_returns_user_payload(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('GET', '/api/auth/me');

        self::assertResponseIsSuccessful();
        $data = $this->decodeJson();
        self::assertSame('admin@climalia.fr', $data['email']);
        self::assertSame('ADMIN', $data['role']);
    }

    #[Test]
    public function me_without_token_returns_401(): void
    {
        $this->client->request('GET', '/api/auth/me');
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    #[Test]
    public function logout_returns_no_content(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('POST', '/api/auth/logout');
        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);
    }

    #[Test]
    public function login_compte_desactive_refuse(): void
    {
        $em = self::getContainer()->get(\Doctrine\ORM\EntityManagerInterface::class);
        \assert($em instanceof \Doctrine\ORM\EntityManagerInterface);
        $repo = self::getContainer()->get(\App\Repository\UserRepository::class);
        \assert($repo instanceof \App\Repository\UserRepository);
        $partner = $repo->findByEmail('syndic@partner.fr');
        self::assertNotNull($partner);
        $partner->setActive(false);
        $em->flush();

        $this->client->jsonRequest('POST', '/api/auth/login', [
            'email' => 'syndic@partner.fr',
            'password' => 'demo',
        ]);
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    #[Test]
    public function token_existant_d_un_compte_desactive_refuse(): void
    {
        // Le token est émis PUIS le compte est désactivé : les requêtes suivantes
        // doivent être refusées (user_checker sur le firewall JWT).
        $em = self::getContainer()->get(\Doctrine\ORM\EntityManagerInterface::class);
        \assert($em instanceof \Doctrine\ORM\EntityManagerInterface);
        $partner = $this->authenticateAs('syndic@partner.fr');
        $partner->setActive(false);
        $em->flush();

        $this->client->request('GET', '/api/auth/me');
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }
}
