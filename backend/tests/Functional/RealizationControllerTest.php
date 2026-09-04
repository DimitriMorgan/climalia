<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;

final class RealizationControllerTest extends ApiTestCase
{
    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        return [
            'title' => 'Test réalisation',
            'description' => 'Une description de test suffisamment longue.',
            'type' => 'RESIDENTIAL',
            'equipmentType' => 'AC',
            'region' => 'Île-de-France',
            'beforeImageUrl' => '/uploads/before.jpg',
            'afterImageUrl' => '/uploads/after.jpg',
            'publishedAt' => '2026-06-01',
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
    public function list_is_public_and_returns_realizations(): void
    {
        $this->client->request('GET', '/api/realizations');

        self::assertResponseIsSuccessful();
        $data = $this->decodeJson();
        self::assertGreaterThan(0, count($data));

        $first = $data[array_key_first($data)];
        self::assertArrayHasKey('id', $first);
        self::assertArrayHasKey('type', $first);
        self::assertArrayHasKey('equipmentType', $first);
        self::assertArrayHasKey('region', $first);
    }

    #[Test]
    public function list_with_equipment_filter_only_returns_matching(): void
    {
        $this->client->request('GET', '/api/realizations?equipmentType=HEAT_PUMP');

        self::assertResponseIsSuccessful();
        $data = $this->decodeJson();
        self::assertGreaterThan(0, count($data));
        foreach ($data as $row) {
            self::assertSame('HEAT_PUMP', $row['equipmentType']);
        }
    }

    #[Test]
    public function create_requires_authentication(): void
    {
        $this->postJson('/api/realizations', $this->validPayload());
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    #[Test]
    public function create_is_forbidden_for_non_editor(): void
    {
        // L'admin hérite de ROLE_EDITOR (role_hierarchy) ; on teste donc avec un
        // partenaire, qui n'a ni ROLE_EDITOR ni ROLE_ADMIN.
        $this->authenticateAs('syndic@partner.fr');
        $this->postJson('/api/realizations', $this->validPayload());
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    #[Test]
    public function admin_can_create_via_role_hierarchy(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->postJson('/api/realizations', $this->validPayload());
        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
    }

    #[Test]
    public function editor_can_create_update_and_delete(): void
    {
        $this->authenticateAs('editor@climalia.fr');

        // Create
        $this->postJson('/api/realizations', $this->validPayload());
        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        $created = $this->decodeJson();
        self::assertArrayHasKey('id', $created);
        self::assertSame('/uploads/before.jpg', $created['beforeImageUrl']);
        $id = (string) $created['id'];

        // Update
        $payload = $this->validPayload();
        $payload['title'] = 'Titre modifié';
        $this->postJson('/api/realizations/' . $id, $payload, 'PUT');
        self::assertResponseIsSuccessful();
        self::assertSame('Titre modifié', $this->decodeJson()['title']);

        // Delete
        $this->client->request('DELETE', '/api/realizations/' . $id);
        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        // Gone
        $this->postJson('/api/realizations/' . $id, $payload, 'PUT');
        self::assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }

    #[Test]
    public function create_with_invalid_payload_returns_422(): void
    {
        $this->authenticateAs('editor@climalia.fr');
        $bad = $this->validPayload();
        $bad['title'] = '';
        $this->postJson('/api/realizations', $bad);
        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
