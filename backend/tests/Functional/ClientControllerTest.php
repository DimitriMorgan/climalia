<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;

final class ClientControllerTest extends ApiTestCase
{
    /**
     * @return array<string, mixed>
     */
    private function validClient(): array
    {
        return [
            'name' => 'Acme SA',
            'segment' => 'TERTIAIRE',
            'region' => 'Île-de-France',
            'contactEmail' => 'nouveau@acme.fr',
            'contactFirstName' => 'Paul',
            'contactLastName' => 'Durand',
            'password' => 'secret123',
        ];
    }

    private function postJson(string $uri, mixed $payload, string $method = 'POST'): void
    {
        $this->client->request(
            $method,
            $uri,
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode($payload),
        );
    }

    #[Test]
    public function admin_lists_clients(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('GET', '/api/clients');

        self::assertResponseIsSuccessful();
        $clients = $this->decodeJson();
        self::assertGreaterThanOrEqual(3, count($clients));
        foreach ($clients as $row) {
            self::assertArrayHasKey('name', $row);
            self::assertArrayHasKey('segment', $row);
            self::assertArrayHasKey('contacts', $row);
        }
    }

    #[Test]
    public function admin_creates_a_client(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->postJson('/api/clients', $this->validClient());

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertSame('Acme SA', $this->decodeJson()['name']);
    }

    #[Test]
    public function duplicate_email_is_rejected(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $payload = $this->validClient();
        $payload['contactEmail'] = 'contact@tour-lumiere.fr';
        $this->postJson('/api/clients', $payload);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    #[Test]
    public function missing_password_is_rejected_on_create(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $payload = $this->validClient();
        unset($payload['password']);
        $this->postJson('/api/clients', $payload);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    #[Test]
    public function non_admin_cannot_access_full_client_list(): void
    {
        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request('GET', '/api/clients');

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    #[Test]
    public function employee_can_list_client_options(): void
    {
        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request('GET', '/api/clients/options');

        self::assertResponseIsSuccessful();
        $options = $this->decodeJson();
        self::assertGreaterThanOrEqual(3, count($options));
        foreach ($options as $row) {
            self::assertArrayHasKey('id', $row);
            self::assertArrayHasKey('label', $row);
        }
    }

    #[Test]
    public function clients_require_authentication(): void
    {
        $this->client->request('GET', '/api/clients');
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }
}
