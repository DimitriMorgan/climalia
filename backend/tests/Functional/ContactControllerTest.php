<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;

final class ContactControllerTest extends ApiTestCase
{
    #[Test]
    public function submit_valid_contact_returns_201(): void
    {
        $this->client->jsonRequest('POST', '/api/contact', [
            'fullName' => 'Pierre Martin',
            'email' => 'pierre@test.fr',
            'phone' => '0612345678',
            'postalCode' => '13001',
            'projectType' => 'HEAT_PUMP',
            'message' => 'Je souhaite installer une pompe à chaleur dans ma maison.',
            'surface' => 110,
        ]);

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        $data = $this->decodeJson();
        self::assertArrayHasKey('id', $data);
        self::assertSame('NEW', $data['status']);
    }

    #[Test]
    public function submit_invalid_email_returns_422(): void
    {
        $this->client->jsonRequest('POST', '/api/contact', [
            'fullName' => 'Pierre Martin',
            'email' => 'not-an-email',
            'phone' => '0612345678',
            'postalCode' => '13001',
            'projectType' => 'HEAT_PUMP',
            'message' => 'Message valide.',
        ]);

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
