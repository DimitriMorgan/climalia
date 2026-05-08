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
}
