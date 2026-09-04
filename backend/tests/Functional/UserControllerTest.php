<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Repository\UserRepository;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;

final class UserControllerTest extends ApiTestCase
{
    #[Test]
    public function admin_liste_tous_les_comptes(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('GET', '/api/users');

        self::assertResponseIsSuccessful();
        $users = $this->decodeJson();
        // 8 comptes staff + 3 contacts clients seedés.
        self::assertGreaterThanOrEqual(11, count($users));

        $emails = array_column($users, 'email');
        self::assertContains('admin@climalia.fr', $emails);
        self::assertContains('contact@tour-lumiere.fr', $emails);

        // Les contacts d'entreprise exposent leur rattachement.
        foreach ($users as $row) {
            if ($row['email'] === 'contact@tour-lumiere.fr') {
                self::assertSame('SCI Tour Lumière', $row['company']['label']);
            }
        }
    }

    #[Test]
    public function employee_ne_peut_pas_lister_les_comptes(): void
    {
        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request('GET', '/api/users');

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    #[Test]
    public function admin_cree_un_compte_employe(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request(
            'POST',
            '/api/users',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode([
                'email' => 'nouvel.employe@climalia.fr',
                'firstName' => 'Paul',
                'lastName' => 'Girard',
                'role' => 'EMPLOYEE',
                'region' => 'Occitanie',
                'password' => 'secret-123',
            ]),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        $data = $this->decodeJson();
        self::assertSame('EMPLOYEE', $data['role']);
        self::assertSame('Occitanie', $data['region']);
    }

    #[Test]
    public function creation_sans_mot_de_passe_echoue(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request(
            'POST',
            '/api/users',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode([
                'email' => 'x@climalia.fr',
                'firstName' => 'X',
                'lastName' => 'Y',
                'role' => 'EMPLOYEE',
            ]),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    #[Test]
    public function creation_role_client_refusee(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request(
            'POST',
            '/api/users',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode([
                'email' => 'c@client.fr',
                'firstName' => 'C',
                'lastName' => 'C',
                'role' => 'CLIENT',
                'password' => 'secret-123',
            ]),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    #[Test]
    public function email_deja_pris_refuse(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request(
            'POST',
            '/api/users',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode([
                'email' => 'editor@climalia.fr',
                'firstName' => 'Doublon',
                'lastName' => 'Doublon',
                'role' => 'EDITOR',
                'password' => 'secret-123',
            ]),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    #[Test]
    public function admin_met_a_jour_un_compte(): void
    {
        $repo = self::getContainer()->get(UserRepository::class);
        \assert($repo instanceof UserRepository);
        $employee = $repo->findByEmail('employe.paca@climalia.fr');
        self::assertNotNull($employee);

        $this->authenticateAs('admin@climalia.fr');
        $this->client->request(
            'PUT',
            '/api/users/' . $employee->getId()->toRfc4122(),
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode([
                'email' => 'employe.paca@climalia.fr',
                'firstName' => 'Sofia',
                'lastName' => 'Moreau-Bianchi',
                'role' => 'EMPLOYEE',
                'region' => 'Corse',
            ]),
        );

        self::assertResponseIsSuccessful();
        $data = $this->decodeJson();
        self::assertSame('Moreau-Bianchi', $data['lastName']);
        self::assertSame('Corse', $data['region']);
    }

    #[Test]
    public function admin_bascule_les_drapeaux_d_un_contact(): void
    {
        $repo = self::getContainer()->get(UserRepository::class);
        \assert($repo instanceof UserRepository);
        $contact = $repo->findByEmail('contact@tour-lumiere.fr');
        self::assertNotNull($contact);

        $this->authenticateAs('admin@climalia.fr');
        $this->client->request(
            'PATCH',
            '/api/users/' . $contact->getId()->toRfc4122(),
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['active' => false, 'notifyOnNewDocument' => false]),
        );

        self::assertResponseIsSuccessful();
        $data = $this->decodeJson();
        self::assertFalse($data['active']);
        self::assertFalse($data['notifyOnNewDocument']);
    }

    #[Test]
    public function admin_ne_peut_pas_se_desactiver(): void
    {
        $admin = $this->authenticateAs('admin@climalia.fr');
        $this->client->request(
            'PATCH',
            '/api/users/' . $admin->getId()->toRfc4122(),
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['active' => false]),
        );

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    #[Test]
    public function admin_ne_peut_pas_se_supprimer(): void
    {
        $admin = $this->authenticateAs('admin@climalia.fr');
        $this->client->request('DELETE', '/api/users/' . $admin->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    #[Test]
    public function admin_supprime_un_autre_compte(): void
    {
        $repo = self::getContainer()->get(UserRepository::class);
        \assert($repo instanceof UserRepository);
        $partner = $repo->findByEmail('gestionnaire@partner.fr');
        self::assertNotNull($partner);

        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('DELETE', '/api/users/' . $partner->getId()->toRfc4122());

        self::assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);
    }
}
