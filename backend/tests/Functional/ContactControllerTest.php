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

    #[Test]
    public function admin_liste_les_demandes_de_devis(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('GET', '/api/contact');

        self::assertResponseIsSuccessful();
        /** @var list<array<string, mixed>> $rows */
        $rows = $this->decodeJson();
        self::assertGreaterThanOrEqual(7, count($rows), 'Les demandes de démo doivent être seedées.');
        self::assertArrayHasKey('fullName', $rows[0]);
        self::assertArrayHasKey('status', $rows[0]);
        self::assertArrayHasKey('projectType', $rows[0]);
    }

    #[Test]
    public function liste_filtrable_par_statut(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('GET', '/api/contact?status=CLOSED');

        self::assertResponseIsSuccessful();
        foreach ($this->decodeJson() as $row) {
            self::assertSame('CLOSED', $row['status']);
        }
    }

    #[Test]
    public function liste_interdite_aux_non_admins(): void
    {
        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request('GET', '/api/contact');

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    #[Test]
    public function liste_sans_token_renvoie_401(): void
    {
        $this->client->request('GET', '/api/contact');

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    #[Test]
    public function admin_change_le_statut_d_une_demande(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('GET', '/api/contact?status=NEW');
        /** @var list<array<string, mixed>> $rows */
        $rows = $this->decodeJson();
        self::assertGreaterThan(0, count($rows));
        $id = $rows[0]['id'];

        $this->client->request(
            'PATCH',
            '/api/contact/' . $id,
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['status' => 'CONTACTED']),
        );

        self::assertResponseIsSuccessful();
        self::assertSame('CONTACTED', $this->decodeJson()['status']);
    }

    #[Test]
    public function statut_invalide_renvoie_422(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('GET', '/api/contact');
        /** @var list<array<string, mixed>> $rows */
        $rows = $this->decodeJson();
        $id = $rows[0]['id'];

        $this->client->request(
            'PATCH',
            '/api/contact/' . $id,
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['status' => 'BANANA']),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    #[Test]
    public function admin_repond_a_une_demande(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('GET', '/api/contact?status=NEW');
        /** @var list<array<string, mixed>> $rows */
        $rows = $this->decodeJson();
        self::assertGreaterThan(0, count($rows), 'Il faut au moins une demande NEW seedée.');
        $row = $rows[0];

        $this->client->request(
            'POST',
            '/api/contact/' . $row['id'] . '/reply',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode([
                'subject' => 'Votre demande de devis — Climalia',
                'message' => 'Bonjour, nous revenons vers vous au sujet de votre projet.',
            ]),
        );

        self::assertResponseIsSuccessful();
        $data = $this->decodeJson();
        // La demande NEW passe automatiquement en CONTACTED et est horodatée.
        self::assertSame('CONTACTED', $data['status']);
        self::assertNotNull($data['repliedAt']);

        self::assertEmailCount(1);
        $email = self::getMailerMessage();
        self::assertNotNull($email);
        self::assertEmailAddressContains($email, 'to', (string) $row['email']);
        self::assertEmailAddressContains($email, 'reply-to', 'admin@climalia.fr');
        self::assertEmailTextBodyContains($email, 'votre projet');
    }

    #[Test]
    public function reply_sans_message_renvoie_422_et_n_envoie_rien(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('GET', '/api/contact');
        /** @var list<array<string, mixed>> $rows */
        $rows = $this->decodeJson();
        $id = $rows[0]['id'];

        $this->client->request(
            'POST',
            '/api/contact/' . $id . '/reply',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['subject' => 'Objet', 'message' => '  ']),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
        self::assertEmailCount(0);
    }

    #[Test]
    public function reply_interdit_sans_token(): void
    {
        // Garde-fou : la règle PUBLIC_ACCESS du formulaire (POST /api/contact)
        // ne doit pas déborder sur la sous-route /reply.
        $this->client->request(
            'POST',
            '/api/contact/00000000-0000-0000-0000-000000000000/reply',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['subject' => 'x', 'message' => 'y']),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    #[Test]
    public function reply_interdit_aux_non_admins(): void
    {
        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request(
            'POST',
            '/api/contact/00000000-0000-0000-0000-000000000000/reply',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['subject' => 'x', 'message' => 'y']),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }
}
