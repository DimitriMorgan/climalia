<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Client;
use App\Entity\ContactRequest;
use App\Entity\Document;
use App\Entity\Realization;
use App\Entity\User;
use App\Enum\ClientSegment;
use App\Enum\ContactStatus;
use App\Enum\DocumentAudience;
use App\Enum\DocumentCategory;
use App\Enum\EquipmentType;
use App\Enum\ProjectType;
use App\Enum\RealizationType;
use App\Enum\UserRole;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\Uuid;

/**
 * Seed idempotent des comptes de démonstration, entreprises clientes, documents
 * et réalisations. Partagé entre {@see \App\DataFixtures\AppFixtures} (dev/test)
 * et {@see \App\Command\SeedDemoCommand} (prod) car le bundle de fixtures est
 * une dépendance dev absente de l'image de production.
 */
final class DemoSeeder
{
    public const DEMO_PASSWORD = 'demo';

    /** Catégories de documents qui sont des livrables clients (dispatch). */
    private const CLIENT_DELIVERABLE_CATEGORIES = [
        DocumentCategory::INVOICE,
        DocumentCategory::MAINTENANCE_CERTIFICATE,
        DocumentCategory::INTERVENTION_REPORT,
        DocumentCategory::MAINTENANCE_CONTRACT,
    ];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $hasher,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
    }

    /**
     * @return array{accounts: int, companies: int, documents: int, realizations: int, assignments: int, contactRequests: int, repairedDocuments: int}
     */
    public function seed(): array
    {
        [$staff, $staffCreated] = $this->seedStaff();
        [$companies, $companiesCreated, $contactsCreated] = $this->seedClients();
        $documentsCreated = $this->seedDocuments($staff);
        $realizationsCreated = $this->seedRealizations();
        $contactRequestsCreated = $this->seedContactRequests();
        $repairedDocuments = $this->repairLegacyDocuments();
        $this->em->flush();

        // Après flush : documents et entreprises existent → on peut dispatcher.
        $assignmentsCreated = $this->seedAssignments($companies);
        $this->em->flush();

        return [
            'accounts' => $staffCreated + $contactsCreated,
            'companies' => $companiesCreated,
            'documents' => $documentsCreated,
            'realizations' => $realizationsCreated,
            'assignments' => $assignmentsCreated,
            'contactRequests' => $contactRequestsCreated,
            'repairedDocuments' => $repairedDocuments,
        ];
    }

    /**
     * Comptes internes (admin, éditeur, employés) et partenaires.
     *
     * @return array{0: array<string, User>, 1: int}
     */
    private function seedStaff(): array
    {
        $definitions = [
            'admin' => ['admin@climalia.fr', UserRole::ADMIN, 'Camille', 'Dubois', null],
            'editor' => ['editor@climalia.fr', UserRole::EDITOR, 'Léa', 'Fontaine', null],
            'employee_idf' => ['employe.idf@climalia.fr', UserRole::EMPLOYEE, 'Karim', 'Benali', 'Île-de-France'],
            'employee_paca' => ['employe.paca@climalia.fr', UserRole::EMPLOYEE, 'Sofia', 'Moreau', 'Provence-Alpes-Côte d\'Azur'],
            'employee_bretagne' => ['employe.bretagne@climalia.fr', UserRole::EMPLOYEE, 'Yann', 'Le Goff', 'Bretagne'],
            'partner_syndic' => ['syndic@partner.fr', UserRole::PARTNER, 'Hélène', 'Roussel', null],
            'partner_be' => ['bureau-etudes@partner.fr', UserRole::PARTNER, 'Mathieu', 'Lefèvre', null],
            'partner_gestionnaire' => ['gestionnaire@partner.fr', UserRole::PARTNER, 'Aïcha', 'Diallo', null],
        ];

        $repo = $this->em->getRepository(User::class);

        $users = [];
        $created = 0;
        foreach ($definitions as $key => [$email, $role, $firstName, $lastName, $region]) {
            $existing = $repo->findOneBy(['email' => strtolower($email)]);
            if ($existing instanceof User) {
                $users[$key] = $existing;
                continue;
            }

            $user = new User($email, 'placeholder', $role, $firstName, $lastName, $region);
            $user->setPasswordHash($this->hasher->hashPassword($user, self::DEMO_PASSWORD));
            $this->em->persist($user);
            $users[$key] = $user;
            ++$created;
        }

        return [$users, $created];
    }

    /**
     * Entreprises clientes + un contact (compte CLIENT) chacune.
     *
     * @return array{0: list<Client>, 1: int, 2: int} [companies, companiesCreated, contactsCreated]
     */
    private function seedClients(): array
    {
        // [companyName, segment, region, contactEmail, contactFirstName, contactLastName]
        $definitions = [
            ['SCI Tour Lumière', ClientSegment::TERTIAIRE, 'Île-de-France', 'contact@tour-lumiere.fr', 'Inès', 'Marchand'],
            ['Hôtel Calanque', ClientSegment::TERTIAIRE, 'Provence-Alpes-Côte d\'Azur', 'gestion@hotel-calanque.fr', 'Bruno', 'Pereira'],
            ['Métalu Industries', ClientSegment::INDUSTRIEL, 'Hauts-de-France', 'services@metalu-industries.fr', 'Nadia', 'Khelif'],
        ];

        $clientRepo = $this->em->getRepository(Client::class);
        $userRepo = $this->em->getRepository(User::class);

        $companies = [];
        $companiesCreated = 0;
        $contactsCreated = 0;
        foreach ($definitions as [$name, $segment, $region, $email, $firstName, $lastName]) {
            $company = $clientRepo->findOneBy(['name' => $name]);
            if (!$company instanceof Client) {
                $company = new Client($name, $segment, $region);
                $this->em->persist($company);
                ++$companiesCreated;
            }
            $companies[] = $company;

            if (!$userRepo->findOneBy(['email' => strtolower($email)]) instanceof User) {
                $contact = new User($email, 'placeholder', UserRole::CLIENT, $firstName, $lastName, $region, $company);
                $contact->setPasswordHash($this->hasher->hashPassword($contact, self::DEMO_PASSWORD));
                $this->em->persist($contact);
                ++$contactsCreated;
            }
        }

        return [$companies, $companiesCreated, $contactsCreated];
    }

    /**
     * Idempotent : ne (re)crée les documents que si la table est vide.
     * L'audience est dérivée de la catégorie ; les livrables clients perdent
     * la visibilité par rôle (ils sont dispatchés par entreprise).
     *
     * @param array<string, User> $users
     */
    private function seedDocuments(array $users): int
    {
        if ($this->em->getRepository(Document::class)->count([]) > 0) {
            return 0;
        }

        $admin = $users['admin'];
        $idf = $users['employee_idf'];
        $paca = $users['employee_paca'];
        $bre = $users['employee_bretagne'];

        // [title, category, owner, visibleToRoles, region]
        // Les livrables clients (contrats/attestations/factures/rapports) sont
        // « possédés » par l'employé qui les a déposés — jamais par un partenaire.
        $rows = [
            ['Planning interventions S20', DocumentCategory::PLANNING, $admin, [UserRole::EMPLOYEE], 'Île-de-France'],
            ['Planning interventions S21', DocumentCategory::PLANNING, $admin, [UserRole::EMPLOYEE], 'Île-de-France'],
            ['Planning maintenance trimestre 2', DocumentCategory::PLANNING, $admin, [UserRole::EMPLOYEE], 'Provence-Alpes-Côte d\'Azur'],

            ['Fiche technique Daikin Altherma 3', DocumentCategory::TECHNICAL_SHEET, $idf, [UserRole::EMPLOYEE, UserRole::PARTNER], null],
            ['Fiche technique Mitsubishi Ecodan', DocumentCategory::TECHNICAL_SHEET, $paca, [UserRole::EMPLOYEE, UserRole::PARTNER], null],
            ['Fiche technique Atlantic Alfea Excellia', DocumentCategory::TECHNICAL_SHEET, $bre, [UserRole::EMPLOYEE], null],
            ['Fiche technique VMC double flux Aldes', DocumentCategory::TECHNICAL_SHEET, $idf, [UserRole::EMPLOYEE, UserRole::PARTNER], null],

            ['Contrat maintenance Résidence Belvédère', DocumentCategory::MAINTENANCE_CONTRACT, $idf, [], 'Île-de-France'],
            ['Contrat maintenance Hôtel Mer & Soleil', DocumentCategory::MAINTENANCE_CONTRACT, $paca, [], 'Provence-Alpes-Côte d\'Azur'],
            ['Contrat maintenance Centre commercial Kerlann', DocumentCategory::MAINTENANCE_CONTRACT, $bre, [], 'Bretagne'],

            ['Procédure interne SAV', DocumentCategory::INTERNAL_DOC, $admin, [UserRole::EMPLOYEE], null],
            ['Charte qualité Climalia', DocumentCategory::INTERNAL_DOC, $admin, [UserRole::EMPLOYEE], null],
            ['Process onboarding nouveau technicien', DocumentCategory::INTERNAL_DOC, $admin, [UserRole::EMPLOYEE], null],

            ['Rapport intervention Tour Lumière #2034', DocumentCategory::INTERVENTION_REPORT, $idf, [], 'Île-de-France'],
            ['Rapport intervention Hôtel Calanque #4112', DocumentCategory::INTERVENTION_REPORT, $paca, [], 'Provence-Alpes-Côte d\'Azur'],
            ['Rapport intervention Médiathèque Brest #1280', DocumentCategory::INTERVENTION_REPORT, $bre, [], 'Bretagne'],
            ['Rapport intervention Logements Cergy #2891', DocumentCategory::INTERVENTION_REPORT, $idf, [], 'Île-de-France'],
            ['Rapport intervention Aéroport Nice #5078', DocumentCategory::INTERVENTION_REPORT, $paca, [], 'Provence-Alpes-Côte d\'Azur'],

            ['Attestation entretien chaudière Résidence Belvédère', DocumentCategory::MAINTENANCE_CERTIFICATE, $idf, [], 'Île-de-France'],
            ['Attestation contrôle PAC Hôtel Mer & Soleil', DocumentCategory::MAINTENANCE_CERTIFICATE, $paca, [], 'Provence-Alpes-Côte d\'Azur'],
            ['Attestation contrôle VMC Centre Kerlann', DocumentCategory::MAINTENANCE_CERTIFICATE, $bre, [], 'Bretagne'],
            ['Attestation entretien climatisation Bureaux Évry', DocumentCategory::MAINTENANCE_CERTIFICATE, $idf, [], 'Île-de-France'],

            ['Facture FA-2025-0148', DocumentCategory::INVOICE, $idf, [], null],
            ['Facture FA-2025-0152', DocumentCategory::INVOICE, $idf, [], 'Île-de-France'],
            ['Facture FA-2025-0167', DocumentCategory::INVOICE, $paca, [], 'Provence-Alpes-Côte d\'Azur'],
            ['Facture FA-2025-0173', DocumentCategory::INVOICE, $bre, [], 'Bretagne'],
            ['Facture FA-2025-0188', DocumentCategory::INVOICE, $idf, [], null],

            ['Procédure escalade urgences', DocumentCategory::INTERNAL_DOC, $admin, [UserRole::EMPLOYEE], null],
            ['Catalogue tarifaire 2026', DocumentCategory::INTERNAL_DOC, $admin, [UserRole::EMPLOYEE, UserRole::PARTNER], null],
            ['Planning grandes vacances équipe', DocumentCategory::PLANNING, $admin, [UserRole::EMPLOYEE], null],
            ['Note de cadrage projet IoT', DocumentCategory::INTERNAL_DOC, $admin, [], null],
        ];

        // Dates métier de démo : plannings, attestations et rapports jalonnent
        // le mois courant pour peupler le calendrier admin.
        $monthStart = new DateTimeImmutable('first day of this month midnight');
        $calendarOffsets = [
            DocumentCategory::PLANNING->value => [2, 9, 16, 23],
            DocumentCategory::MAINTENANCE_CERTIFICATE->value => [5, 12, 19, 26],
            DocumentCategory::INTERVENTION_REPORT->value => [1, 8, 15, 22, 27],
        ];
        $perCategoryIndex = [];

        foreach ($rows as [$title, $category, $owner, $visibleToRoles, $region]) {
            $isClientDeliverable = in_array($category, self::CLIENT_DELIVERABLE_CATEGORIES, true);
            $audience = $isClientDeliverable ? DocumentAudience::CLIENT : DocumentAudience::INTERNAL;

            [$storageName, $size] = $this->writeDemoPdf($title, $category->value);
            $doc = new Document(
                $title,
                $category,
                fileUrl: null,
                mimeType: 'application/pdf',
                sizeBytes: $size,
                ownerUser: $owner,
                visibleToRoles: $isClientDeliverable ? [] : $visibleToRoles,
                region: $region,
                audience: $audience,
            );
            $doc->setStoragePath($storageName);

            $offsets = $calendarOffsets[$category->value] ?? null;
            if ($offsets !== null) {
                $i = $perCategoryIndex[$category->value] ?? 0;
                $perCategoryIndex[$category->value] = $i + 1;
                $doc->setDocumentDate($monthStart->modify('+' . (string) $offsets[$i % count($offsets)] . ' days'));
            }

            $this->em->persist($doc);
        }

        return count($rows);
    }

    /**
     * Répare les documents de démo hérités (URL externe factice, aucun fichier
     * stocké) en leur générant un vrai PDF : le téléchargement et l'aperçu
     * fonctionnent alors aussi sur une base déjà seedée (prod).
     */
    private function repairLegacyDocuments(): int
    {
        $repaired = 0;
        foreach ($this->em->getRepository(Document::class)->findAll() as $document) {
            if ($document->getStoragePath() !== null) {
                continue;
            }
            $fileUrl = $document->getFileUrl();
            if ($fileUrl === null || !str_starts_with($fileUrl, 'https://files.climalia.test/')) {
                continue;
            }

            [$storageName, $size] = $this->writeDemoPdf($document->getTitle(), $document->getCategory()->value);
            $document->setStoragePath($storageName);
            $document->setFileUrl(null);
            $document->setSizeBytes($size);
            ++$repaired;
        }

        return $repaired;
    }

    /**
     * Écrit un PDF minimal (une page, titre + sous-titre) dans le stockage
     * privé des documents et renvoie [nom de fichier, taille en octets].
     *
     * @return array{0: string, 1: int}
     */
    private function writeDemoPdf(string $title, string $subtitle): array
    {
        $storageDir = $this->projectDir . '/var/documents';
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0775, true);
        }

        $storageName = Uuid::v7()->toRfc4122() . '.pdf';
        $bytes = $this->minimalPdf($title, $subtitle);
        file_put_contents($storageDir . '/' . $storageName, $bytes);

        return [$storageName, strlen($bytes)];
    }

    /**
     * Génère un PDF 1.4 valide sans dépendance : une page A4, deux lignes de
     * texte en Helvetica. Suffisant pour démontrer téléchargement et aperçu.
     */
    private function minimalPdf(string $title, string $subtitle): string
    {
        $toAscii = static function (string $text): string {
            $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);

            return $ascii === false || $ascii === '' ? 'Document Climalia' : $ascii;
        };
        $escape = static fn (string $text): string => str_replace(
            ['\\', '(', ')'],
            ['\\\\', '\\(', '\\)'],
            $text,
        );

        $line1 = $escape($toAscii($title));
        $line2 = $escape($toAscii('Climalia - document de demonstration - ' . $subtitle));
        $stream = "BT /F1 18 Tf 56 770 Td ({$line1}) Tj ET\n"
            . "BT /F1 10 Tf 56 742 Td ({$line2}) Tj ET";

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            sprintf("<< /Length %d >>\nstream\n%s\nendstream", strlen($stream), $stream),
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $i => $body) {
            $offsets[] = strlen($pdf);
            $pdf .= sprintf("%d 0 obj\n%s\nendobj\n", $i + 1, $body);
        }
        $xrefPos = strlen($pdf);
        $pdf .= 'xref' . "\n" . '0 ' . (string) (count($objects) + 1) . "\n" . "0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }
        $pdf .= "trailer\n<< /Size " . (string) (count($objects) + 1) . " /Root 1 0 R >>\n"
            . "startxref\n" . (string) $xrefPos . "\n%%EOF\n";

        return $pdf;
    }

    /**
     * Idempotent : ne (re)crée les demandes de devis de démo que si la table
     * est vide (alimente la page admin « Devis »).
     */
    private function seedContactRequests(): int
    {
        if ($this->em->getRepository(ContactRequest::class)->count([]) > 0) {
            return 0;
        }

        $now = new DateTimeImmutable();
        // [fullName, email, phone, cp, type, message, surface, deadline, ageJours, statut]
        $rows = [
            ['Claire Besson', 'claire.besson@orange.fr', '06 12 44 78 90', '75011', ProjectType::INSTALLATION_AC, "Appartement 3 pièces au dernier étage, très chaud l'été. Je souhaite un devis pour une climatisation réversible discrète.", 68, '+2 months', 1, ContactStatus::NEW],
            ['Marc Delattre', 'm.delattre@gmail.com', '06 98 21 03 47', '69003', ProjectType::HEAT_PUMP, 'Maison de 1998 chauffée au gaz, je veux passer sur une PAC air-eau. Quelles aides mobilisables ?', 140, '+4 months', 2, ContactStatus::NEW],
            ['Sonia Belkacem', 'sonia.belkacem@hotmail.fr', '07 61 55 20 18', '13008', ProjectType::MAINTENANCE, "Recherche un contrat d'entretien annuel pour 2 splits et une PAC installés en 2022.", null, null, 4, ContactStatus::CONTACTED],
            ['Groupe Hertier — M. Fabre', 'p.fabre@groupe-hertier.fr', '04 72 10 88 32', '69100', ProjectType::VMC, 'Réhabilitation d\'un plateau de bureaux de 600 m² : remplacement complet de la VMC, étude à prévoir sur site.', 600, '+6 months', 6, ContactStatus::CONTACTED],
            ['Julie Rambert', 'julie.rambert@free.fr', '06 30 17 92 64', '35000', ProjectType::REPAIR, "Ma PAC affiche un code défaut E362 et ne chauffe plus. Intervention rapide possible cette semaine ?", null, '+1 week', 8, ContactStatus::NEW],
            ['Syndic Vauban', 'contact@syndic-vauban.fr', '01 47 22 60 05', '92200', ProjectType::INSTALLATION_AC, 'Copropriété de 24 lots : étude pour climatisation des parties communes et de 6 appartements témoins.', 380, '+3 months', 12, ContactStatus::CLOSED],
            ['Antoine Muller', 'antoine.muller@posteo.net', '06 74 48 11 29', '67000', ProjectType::HEAT_PUMP, 'Demande de devis PAC air-air pour un duplex de 95 m², idéalement avant l\'hiver.', 95, '+5 months', 15, ContactStatus::CLOSED],
        ];

        foreach ($rows as [$name, $email, $phone, $cp, $type, $message, $surface, $deadline, $ageDays, $status]) {
            $contact = new ContactRequest(
                $name,
                $email,
                $phone,
                $cp,
                $type,
                $message,
                $surface,
                $deadline !== null ? $now->modify($deadline) : null,
                $now->modify(sprintf('-%d days', $ageDays)),
            );
            $contact->setStatus($status);
            $this->em->persist($contact);
        }

        return count($rows);
    }

    /**
     * Idempotent : affecte les livrables clients aux entreprises de démo si
     * aucune affectation n'existe encore.
     *
     * @param list<Client> $companies
     */
    private function seedAssignments(array $companies): int
    {
        $documents = $this->em->getRepository(Document::class)->findAll();
        foreach ($documents as $document) {
            if (!$document->getAssignedClients()->isEmpty()) {
                return 0; // déjà dispatché
            }
        }
        if ($companies === [] || $documents === []) {
            return 0;
        }

        $deliverables = array_values(array_filter(
            $documents,
            static fn (Document $d): bool => $d->getAudience() === DocumentAudience::CLIENT,
        ));

        $created = 0;
        foreach ($deliverables as $i => $document) {
            $document->addAssignedClient($companies[$i % count($companies)]);
            ++$created;
        }

        return $created;
    }

    /**
     * Idempotent : ne (re)crée les réalisations que si la table est vide.
     */
    private function seedRealizations(): int
    {
        if ($this->em->getRepository(Realization::class)->count([]) > 0) {
            return 0;
        }

        $rows = [
            ['Climatisation appartement Haussmann', 'Pose de splits muraux design dans un 4 pièces parisien.', RealizationType::RESIDENTIAL, EquipmentType::AC, 'Île-de-France', '2026-01-12'],
            ['PAC air-eau Mas provençal', 'Remplacement chaudière fioul par PAC haute performance.', RealizationType::RESIDENTIAL, EquipmentType::HEAT_PUMP, 'Provence-Alpes-Côte d\'Azur', '2026-02-04'],
            ['VMC double flux maison passive', 'Installation VMC double flux haut rendement.', RealizationType::RESIDENTIAL, EquipmentType::VMC, 'Bretagne', '2026-02-22'],
            ['Climatisation centre médical Lyon', 'VRV multi-zones pour cabinet médical.', RealizationType::TERTIARY, EquipmentType::AC, 'Auvergne-Rhône-Alpes', '2026-03-10'],
            ['PAC géothermique siège social', 'Solution géothermique 120 kW pour bâtiment de bureaux.', RealizationType::TERTIARY, EquipmentType::HEAT_PUMP, 'Hauts-de-France', '2026-03-28'],
            ['VMC hygroréglable école', 'Renouvellement complet VMC hygro B école élémentaire.', RealizationType::TERTIARY, EquipmentType::VMC, 'Nouvelle-Aquitaine', '2026-04-04'],
            ['PAC réversible villa', 'Climatisation réversible duplex avec gestion connectée.', RealizationType::RESIDENTIAL, EquipmentType::HEAT_PUMP, 'Occitanie', '2026-04-15'],
            ['Climatisation hôtel front de mer', '40 chambres équipées en climatisation silencieuse.', RealizationType::TERTIARY, EquipmentType::AC, 'Provence-Alpes-Côte d\'Azur', '2026-04-25'],
            ['VMC double flux résidence neuve', '36 logements neufs équipés VMC haut rendement.', RealizationType::RESIDENTIAL, EquipmentType::VMC, 'Île-de-France', '2026-05-02'],
            ['PAC hybride EHPAD', 'Hybride PAC + appoint gaz, gestion saisonnière.', RealizationType::TERTIARY, EquipmentType::HEAT_PUMP, 'Grand Est', '2026-05-06'],
        ];

        foreach ($rows as [$title, $description, $type, $equipment, $region, $publishedAtIso]) {
            $realization = new Realization(
                title: $title,
                description: $description,
                type: $type,
                equipmentType: $equipment,
                region: $region,
                publishedAt: new DateTimeImmutable($publishedAtIso),
            );
            $this->em->persist($realization);
        }

        return count($rows);
    }
}
