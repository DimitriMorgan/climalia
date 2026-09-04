<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\Client;
use App\Entity\Document;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Response;

final class DocumentControllerTest extends ApiTestCase
{
    private function uploadedFile(): UploadedFile
    {
        $path = (string) tempnam(sys_get_temp_dir(), 'doc');
        file_put_contents($path, "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n");

        // test: true => bypass is_uploaded_file() en environnement de test.
        return new UploadedFile($path, 'rapport.pdf', 'application/pdf', null, true);
    }

    private function companyIdFor(string $contactEmail): string
    {
        $repo = self::getContainer()->get(UserRepository::class);
        \assert($repo instanceof UserRepository);
        $contact = $repo->findByEmail($contactEmail);
        \assert($contact instanceof User);
        $company = $contact->getClient();
        \assert($company instanceof Client);

        return $company->getId()->toRfc4122();
    }

    #[Test]
    public function employee_can_upload_a_document(): void
    {
        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request(
            'POST',
            '/api/documents',
            ['title' => 'Rapport test', 'category' => 'INTERVENTION_REPORT'],
            ['file' => $this->uploadedFile()],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertTrue($this->decodeJson()['hasFile']);
    }

    #[Test]
    public function client_cannot_upload_a_document(): void
    {
        $this->authenticateAs('contact@tour-lumiere.fr');
        $this->client->request(
            'POST',
            '/api/documents',
            ['title' => 'x', 'category' => 'INVOICE'],
            ['file' => $this->uploadedFile()],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    #[Test]
    public function client_only_sees_assigned_documents(): void
    {
        $this->authenticateAs('contact@tour-lumiere.fr');
        $this->client->request('GET', '/api/documents');

        self::assertResponseIsSuccessful();
        $docs = $this->decodeJson();
        self::assertGreaterThan(0, count($docs));
        foreach ($docs as $row) {
            self::assertNotSame('PLANNING', $row['category'], 'Un client ne doit pas voir les plannings.');
        }
    }

    #[Test]
    public function admin_dispatch_makes_document_visible_to_client(): void
    {
        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        $planning = $em->getRepository(Document::class)->findOneBy(['category' => 'PLANNING']);
        self::assertNotNull($planning);
        $planningId = $planning->getId()->toRfc4122();
        $companyId = $this->companyIdFor('contact@tour-lumiere.fr');

        $this->authenticateAs('admin@climalia.fr');
        $this->client->request(
            'PUT',
            '/api/documents/' . $planningId . '/clients',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['clientIds' => [$companyId]]),
        );
        self::assertResponseIsSuccessful();

        // Le client voit désormais ce document.
        $this->authenticateAs('contact@tour-lumiere.fr');
        $this->client->request('GET', '/api/documents');
        $ids = [];
        foreach ($this->decodeJson() as $row) {
            $ids[] = $row['id'];
        }
        self::assertContains($planningId, $ids);
    }

    #[Test]
    public function employee_cannot_dispatch(): void
    {
        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        $doc = $em->getRepository(Document::class)->findOneBy([]);
        self::assertNotNull($doc);

        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request(
            'PUT',
            '/api/documents/' . $doc->getId()->toRfc4122() . '/clients',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['clientIds' => []]),
        );
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    #[Test]
    public function admin_voit_tous_les_documents(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('GET', '/api/documents');

        self::assertResponseIsSuccessful();
        $all = $this->decodeJson();
        self::assertGreaterThanOrEqual(20, count($all));
    }

    #[Test]
    public function employee_ne_voit_que_les_documents_employees_ou_les_siens(): void
    {
        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        // Livrable déposé par un AUTRE employé (région PACA) — idf ne doit pas le voir.
        $otherInvoice = $em->getRepository(Document::class)->findOneBy(['title' => 'Facture FA-2025-0167']);
        self::assertNotNull($otherInvoice);
        $otherId = $otherInvoice->getId()->toRfc4122();

        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request('GET', '/api/documents');

        self::assertResponseIsSuccessful();
        $employeeView = $this->decodeJson();
        self::assertGreaterThan(0, count($employeeView));

        $ids = [];
        foreach ($employeeView as $row) {
            $ids[] = $row['id'];
        }
        self::assertNotContains($otherId, $ids);
    }

    #[Test]
    public function partner_ne_voit_pas_les_planning_employees_only(): void
    {
        $this->authenticateAs('syndic@partner.fr');
        $this->client->request('GET', '/api/documents');

        self::assertResponseIsSuccessful();
        $partnerView = $this->decodeJson();
        foreach ($partnerView as $row) {
            self::assertNotSame('PLANNING', $row['category']);
        }
    }

    #[Test]
    public function partner_only_sees_shared_resources_not_client_deliverables(): void
    {
        // Garde anti-régression de la fuite inter-locataires : un partenaire ne
        // voit que des ressources internes/partagées, jamais un livrable client.
        $this->authenticateAs('syndic@partner.fr');
        $this->client->request('GET', '/api/documents');

        self::assertResponseIsSuccessful();
        foreach ($this->decodeJson() as $row) {
            self::assertSame('INTERNAL', $row['audience']);
        }
    }

    #[Test]
    public function listing_sans_token_retourne_401(): void
    {
        $this->client->request('GET', '/api/documents');
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    #[Test]
    public function editor_n_a_pas_acces_aux_documents(): void
    {
        // Profil purement éditorial : aucun accès à l'espace documentaire.
        $this->authenticateAs('editor@climalia.fr');
        $this->client->request('GET', '/api/documents');
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    #[Test]
    public function upload_avec_date_metier_la_persiste(): void
    {
        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request(
            'POST',
            '/api/documents',
            ['title' => 'Planning daté', 'category' => 'PLANNING', 'documentDate' => '2026-08-15'],
            ['file' => $this->uploadedFile()],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertSame('2026-08-15', $this->decodeJson()['documentDate']);
    }

    #[Test]
    public function admin_pose_deplace_et_retire_la_date_metier(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $this->client->request(
            'POST',
            '/api/documents',
            ['title' => 'Doc à dater', 'category' => 'INTERNAL_DOC'],
            ['file' => $this->uploadedFile()],
        );
        $created = $this->decodeJson();
        self::assertNull($created['documentDate']);
        $id = $created['id'];
        \assert(is_string($id));

        $this->client->request(
            'PATCH',
            '/api/documents/' . $id,
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['documentDate' => '2026-09-01']),
        );
        self::assertResponseIsSuccessful();
        self::assertSame('2026-09-01', $this->decodeJson()['documentDate']);

        $this->client->request(
            'PATCH',
            '/api/documents/' . $id,
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['documentDate' => null]),
        );
        self::assertResponseIsSuccessful();
        self::assertNull($this->decodeJson()['documentDate']);
    }

    #[Test]
    public function patch_de_la_date_interdit_aux_non_admins(): void
    {
        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        $doc = $em->getRepository(Document::class)->findOneBy([]);
        self::assertNotNull($doc);

        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request(
            'PATCH',
            '/api/documents/' . $doc->getId()->toRfc4122(),
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['documentDate' => '2026-09-01']),
        );
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    #[Test]
    public function download_d_un_document_stocke_streame_le_fichier(): void
    {
        $this->authenticateAs('admin@climalia.fr');

        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        $doc = $em->getRepository(Document::class)->findOneBy([]);
        self::assertNotNull($doc);
        self::assertNotNull($doc->getStoragePath(), 'Les documents seedés doivent avoir un fichier stocké.');

        $this->client->request('GET', '/api/documents/' . $doc->getId()->toRfc4122() . '/download');
        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('Content-Type', 'application/pdf');
        $disposition = (string) $this->client->getResponse()->headers->get('Content-Disposition');
        self::assertStringContainsString('attachment', $disposition);
    }

    #[Test]
    public function download_d_un_document_herite_renvoie_les_meta(): void
    {
        // Document hérité : URL externe, aucun fichier stocké → le back renvoie
        // les métadonnées JSON (compat phase 1).
        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        $legacy = new Document(
            'Document externe hérité',
            \App\Enum\DocumentCategory::INTERNAL_DOC,
            fileUrl: 'https://exemple.climalia.fr/legacy.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 1234,
            visibleToRoles: [\App\Enum\UserRole::EMPLOYEE],
        );
        $em->persist($legacy);
        $em->flush();

        $this->authenticateAs('admin@climalia.fr');
        $this->client->request('GET', '/api/documents/' . $legacy->getId()->toRfc4122() . '/download');
        self::assertResponseIsSuccessful();
        $data = $this->decodeJson();
        self::assertSame('https://exemple.climalia.fr/legacy.pdf', $data['fileUrl']);
    }

    #[Test]
    public function get_detail_d_un_document_visible(): void
    {
        $this->authenticateAs('admin@climalia.fr');

        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        $doc = $em->getRepository(Document::class)->findOneBy([]);
        self::assertNotNull($doc);

        $this->client->request('GET', '/api/documents/' . $doc->getId()->toRfc4122());
        self::assertResponseIsSuccessful();
        $data = $this->decodeJson();
        self::assertSame($doc->getId()->toRfc4122(), $data['id']);
        self::assertArrayHasKey('hasFile', $data);
        // Vue admin : uploadeur + affectations exposés.
        self::assertArrayHasKey('uploadedBy', $data);
        self::assertArrayHasKey('assignedClients', $data);
    }

    #[Test]
    public function get_detail_refuse_si_voter_dit_non(): void
    {
        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        $invoice = $em->getRepository(Document::class)->findOneBy(['title' => 'Facture FA-2025-0167']);
        self::assertNotNull($invoice);

        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request('GET', '/api/documents/' . $invoice->getId()->toRfc4122());
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    #[Test]
    public function upload_avec_notification_envoie_un_email_aux_contacts(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $companyId = $this->companyIdFor('contact@tour-lumiere.fr');

        $this->client->request(
            'POST',
            '/api/documents',
            [
                'title' => 'Rapport avec notification',
                'category' => 'INTERVENTION_REPORT',
                'audience' => 'CLIENT',
                'assignedClientIds' => [$companyId],
                'notify' => '1',
            ],
            ['file' => $this->uploadedFile()],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertEmailCount(1);
        $email = self::getMailerMessage();
        self::assertNotNull($email);
        self::assertEmailAddressContains($email, 'to', 'contact@tour-lumiere.fr');
        self::assertEmailTextBodyContains($email, 'Rapport avec notification');
    }

    #[Test]
    public function upload_sans_notification_n_envoie_rien(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $companyId = $this->companyIdFor('contact@tour-lumiere.fr');

        $this->client->request(
            'POST',
            '/api/documents',
            [
                'title' => 'Rapport silencieux',
                'category' => 'INTERVENTION_REPORT',
                'audience' => 'CLIENT',
                'assignedClientIds' => [$companyId],
            ],
            ['file' => $this->uploadedFile()],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertEmailCount(0);
    }

    #[Test]
    public function dispatch_ne_notifie_que_les_nouvelles_entreprises(): void
    {
        $this->authenticateAs('admin@climalia.fr');
        $companyA = $this->companyIdFor('contact@tour-lumiere.fr');
        $companyB = $this->companyIdFor('gestion@hotel-calanque.fr');

        // Livrable déjà affecté à A (sans notification).
        $this->client->request(
            'POST',
            '/api/documents',
            ['title' => 'Livrable à re-dispatcher', 'category' => 'INVOICE', 'audience' => 'CLIENT', 'assignedClientIds' => [$companyA]],
            ['file' => $this->uploadedFile()],
        );
        $docId = $this->decodeJson()['id'];
        \assert(is_string($docId));

        // Re-dispatch A + B avec notification → seul le contact de B est notifié.
        $this->client->request(
            'PUT',
            '/api/documents/' . $docId . '/clients',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['clientIds' => [$companyA, $companyB], 'notify' => true]),
        );

        self::assertResponseIsSuccessful();
        self::assertEmailCount(1);
        $email = self::getMailerMessage();
        self::assertNotNull($email);
        self::assertEmailAddressContains($email, 'to', 'gestion@hotel-calanque.fr');
    }

    #[Test]
    public function contact_desabonne_ne_recoit_pas_d_email(): void
    {
        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        $repo = self::getContainer()->get(UserRepository::class);
        \assert($repo instanceof UserRepository);
        $contact = $repo->findByEmail('contact@tour-lumiere.fr');
        self::assertNotNull($contact);
        $contact->setNotifyOnNewDocument(false);
        $em->flush();

        $this->authenticateAs('admin@climalia.fr');
        $this->client->request(
            'POST',
            '/api/documents',
            [
                'title' => 'Rapport pour contact désabonné',
                'category' => 'INTERVENTION_REPORT',
                'audience' => 'CLIENT',
                'assignedClientIds' => [$this->companyIdFor('contact@tour-lumiere.fr')],
                'notify' => '1',
            ],
            ['file' => $this->uploadedFile()],
        );

        self::assertResponseStatusCodeSame(Response::HTTP_CREATED);
        self::assertEmailCount(0);
    }

    #[Test]
    public function download_refuse_si_voter_dit_non(): void
    {
        // Un employé tente de télécharger un livrable déposé par un AUTRE employé.
        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        $invoice = $em->getRepository(Document::class)->findOneBy(['title' => 'Facture FA-2025-0167']);
        self::assertNotNull($invoice, 'Facture de démo introuvable.');

        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request('GET', '/api/documents/' . $invoice->getId()->toRfc4122() . '/download');
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }
}
