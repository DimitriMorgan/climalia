<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\Document;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;

final class DocumentControllerTest extends ApiTestCase
{
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
        $this->authenticateAs('employe.idf@climalia.fr');
        $this->client->request('GET', '/api/documents');

        self::assertResponseIsSuccessful();
        $employeeView = $this->decodeJson();
        self::assertGreaterThan(0, count($employeeView));

        // Aucun document INVOICE (PARTNER-only) ne doit remonter pour cet employé.
        foreach ($employeeView as $row) {
            self::assertNotSame('INVOICE', $row['category']);
        }
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
    public function listing_sans_token_retourne_401(): void
    {
        $this->client->request('GET', '/api/documents');
        self::assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    #[Test]
    public function download_d_un_document_visible_renvoie_les_meta(): void
    {
        $this->authenticateAs('admin@climalia.fr');

        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        $doc = $em->getRepository(Document::class)->findOneBy([]);
        self::assertNotNull($doc);

        $this->client->request('GET', '/api/documents/' . $doc->getId()->toRfc4122() . '/download');
        self::assertResponseIsSuccessful();
        $data = $this->decodeJson();
        self::assertArrayHasKey('fileUrl', $data);
    }

    #[Test]
    public function download_refuse_si_voter_dit_non(): void
    {
        // Un employee tente de télécharger une facture PARTNER-only
        $this->authenticateAs('employe.idf@climalia.fr');

        $em = self::getContainer()->get(EntityManagerInterface::class);
        \assert($em instanceof EntityManagerInterface);
        $invoice = $em->getRepository(Document::class)->findOneBy(['category' => 'INVOICE']);
        self::assertNotNull($invoice, 'Aucune facture trouvée dans les fixtures.');

        $this->client->request('GET', '/api/documents/' . $invoice->getId()->toRfc4122() . '/download');
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }
}
