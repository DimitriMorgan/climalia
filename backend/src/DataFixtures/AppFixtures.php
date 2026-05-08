<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\Document;
use App\Entity\Realization;
use App\Entity\User;
use App\Enum\DocumentCategory;
use App\Enum\EquipmentType;
use App\Enum\RealizationType;
use App\Enum\UserRole;
use DateTimeImmutable;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AppFixtures extends Fixture
{
    private const DEMO_PASSWORD = 'demo';

    public function __construct(
        private readonly UserPasswordHasherInterface $hasher,
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        $users = $this->loadUsers($manager);
        $this->loadDocuments($manager, $users);
        $this->loadRealizations($manager);

        $manager->flush();
    }

    /**
     * @return array<string, User>
     */
    private function loadUsers(ObjectManager $manager): array
    {
        $definitions = [
            'admin' => ['admin@climalia.fr', UserRole::ADMIN, 'Camille', 'Dubois', null],
            'employee_idf' => ['employe.idf@climalia.fr', UserRole::EMPLOYEE, 'Karim', 'Benali', 'Île-de-France'],
            'employee_paca' => ['employe.paca@climalia.fr', UserRole::EMPLOYEE, 'Sofia', 'Moreau', 'Provence-Alpes-Côte d\'Azur'],
            'employee_bretagne' => ['employe.bretagne@climalia.fr', UserRole::EMPLOYEE, 'Yann', 'Le Goff', 'Bretagne'],
            'partner_syndic' => ['syndic@partner.fr', UserRole::PARTNER, 'Hélène', 'Roussel', null],
            'partner_be' => ['bureau-etudes@partner.fr', UserRole::PARTNER, 'Mathieu', 'Lefèvre', null],
            'partner_gestionnaire' => ['gestionnaire@partner.fr', UserRole::PARTNER, 'Aïcha', 'Diallo', null],
        ];

        $users = [];
        foreach ($definitions as $key => [$email, $role, $firstName, $lastName, $region]) {
            $user = new User($email, 'placeholder', $role, $firstName, $lastName, $region);
            $user->setPasswordHash($this->hasher->hashPassword($user, self::DEMO_PASSWORD));
            $manager->persist($user);
            $users[$key] = $user;
        }

        return $users;
    }

    /**
     * @param array<string, User> $users
     */
    private function loadDocuments(ObjectManager $manager, array $users): void
    {
        $admin = $users['admin'];
        $idf = $users['employee_idf'];
        $paca = $users['employee_paca'];
        $bre = $users['employee_bretagne'];
        $syndic = $users['partner_syndic'];
        $be = $users['partner_be'];
        $gest = $users['partner_gestionnaire'];

        // [title, category, owner, visibleToRoles, region]
        $rows = [
            ['Planning interventions S20', DocumentCategory::PLANNING, $admin, [UserRole::EMPLOYEE], 'Île-de-France'],
            ['Planning interventions S21', DocumentCategory::PLANNING, $admin, [UserRole::EMPLOYEE], 'Île-de-France'],
            ['Planning maintenance trimestre 2', DocumentCategory::PLANNING, $admin, [UserRole::EMPLOYEE], 'Provence-Alpes-Côte d\'Azur'],

            ['Fiche technique Daikin Altherma 3', DocumentCategory::TECHNICAL_SHEET, $idf, [UserRole::EMPLOYEE, UserRole::PARTNER], null],
            ['Fiche technique Mitsubishi Ecodan', DocumentCategory::TECHNICAL_SHEET, $paca, [UserRole::EMPLOYEE, UserRole::PARTNER], null],
            ['Fiche technique Atlantic Alfea Excellia', DocumentCategory::TECHNICAL_SHEET, $bre, [UserRole::EMPLOYEE], null],
            ['Fiche technique VMC double flux Aldes', DocumentCategory::TECHNICAL_SHEET, $idf, [UserRole::EMPLOYEE, UserRole::PARTNER], null],

            ['Contrat maintenance Résidence Belvédère', DocumentCategory::MAINTENANCE_CONTRACT, $syndic, [UserRole::PARTNER], 'Île-de-France'],
            ['Contrat maintenance Hôtel Mer & Soleil', DocumentCategory::MAINTENANCE_CONTRACT, $gest, [UserRole::PARTNER], 'Provence-Alpes-Côte d\'Azur'],
            ['Contrat maintenance Centre commercial Kerlann', DocumentCategory::MAINTENANCE_CONTRACT, $gest, [UserRole::PARTNER], 'Bretagne'],

            ['Procédure interne SAV', DocumentCategory::INTERNAL_DOC, $admin, [UserRole::EMPLOYEE], null],
            ['Charte qualité Climalia', DocumentCategory::INTERNAL_DOC, $admin, [UserRole::EMPLOYEE], null],
            ['Process onboarding nouveau technicien', DocumentCategory::INTERNAL_DOC, $admin, [UserRole::EMPLOYEE], null],

            ['Rapport intervention Tour Lumière #2034', DocumentCategory::INTERVENTION_REPORT, $idf, [UserRole::EMPLOYEE], 'Île-de-France'],
            ['Rapport intervention Hôtel Calanque #4112', DocumentCategory::INTERVENTION_REPORT, $paca, [UserRole::EMPLOYEE], 'Provence-Alpes-Côte d\'Azur'],
            ['Rapport intervention Médiathèque Brest #1280', DocumentCategory::INTERVENTION_REPORT, $bre, [UserRole::EMPLOYEE], 'Bretagne'],
            ['Rapport intervention Logements Cergy #2891', DocumentCategory::INTERVENTION_REPORT, $idf, [UserRole::EMPLOYEE, UserRole::PARTNER], 'Île-de-France'],
            ['Rapport intervention Aéroport Nice #5078', DocumentCategory::INTERVENTION_REPORT, $paca, [UserRole::EMPLOYEE], 'Provence-Alpes-Côte d\'Azur'],

            ['Attestation entretien chaudière Résidence Belvédère', DocumentCategory::MAINTENANCE_CERTIFICATE, $syndic, [UserRole::PARTNER], 'Île-de-France'],
            ['Attestation contrôle PAC Hôtel Mer & Soleil', DocumentCategory::MAINTENANCE_CERTIFICATE, $gest, [UserRole::PARTNER], 'Provence-Alpes-Côte d\'Azur'],
            ['Attestation contrôle VMC Centre Kerlann', DocumentCategory::MAINTENANCE_CERTIFICATE, $gest, [UserRole::PARTNER], 'Bretagne'],
            ['Attestation entretien climatisation Bureaux Évry', DocumentCategory::MAINTENANCE_CERTIFICATE, $syndic, [UserRole::PARTNER], 'Île-de-France'],

            ['Facture FA-2025-0148', DocumentCategory::INVOICE, $be, [UserRole::PARTNER], null],
            ['Facture FA-2025-0152', DocumentCategory::INVOICE, $syndic, [UserRole::PARTNER], 'Île-de-France'],
            ['Facture FA-2025-0167', DocumentCategory::INVOICE, $gest, [UserRole::PARTNER], 'Provence-Alpes-Côte d\'Azur'],
            ['Facture FA-2025-0173', DocumentCategory::INVOICE, $gest, [UserRole::PARTNER], 'Bretagne'],
            ['Facture FA-2025-0188', DocumentCategory::INVOICE, $be, [UserRole::PARTNER], null],

            ['Procédure escalade urgences', DocumentCategory::INTERNAL_DOC, $admin, [UserRole::EMPLOYEE], null],
            ['Catalogue tarifaire 2026', DocumentCategory::INTERNAL_DOC, $admin, [UserRole::EMPLOYEE, UserRole::PARTNER], null],
            ['Planning grandes vacances équipe', DocumentCategory::PLANNING, $admin, [UserRole::EMPLOYEE], null],
            ['Note de cadrage projet IoT', DocumentCategory::INTERNAL_DOC, $admin, [], null],
        ];

        foreach ($rows as $i => [$title, $category, $owner, $visibleToRoles, $region]) {
            $doc = new Document(
                $title,
                $category,
                fileUrl: sprintf('https://files.climalia.test/%s.pdf', preg_replace('/[^a-z0-9]+/i', '-', strtolower($title)) ?? (string) $i),
                mimeType: 'application/pdf',
                sizeBytes: 50_000 + ($i * 1234),
                ownerUser: $owner,
                visibleToRoles: $visibleToRoles,
                region: $region,
            );
            $manager->persist($doc);
        }
    }

    private function loadRealizations(ObjectManager $manager): void
    {
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
            $publishedAt = new DateTimeImmutable($publishedAtIso);
            $realization = new Realization(
                title: $title,
                description: $description,
                type: $type,
                equipmentType: $equipment,
                region: $region,
                beforeImageUrl: sprintf('https://cdn.climalia.test/realisations/%s/before.jpg', preg_replace('/[^a-z0-9]+/i', '-', strtolower($title)) ?? 'item'),
                afterImageUrl: sprintf('https://cdn.climalia.test/realisations/%s/after.jpg', preg_replace('/[^a-z0-9]+/i', '-', strtolower($title)) ?? 'item'),
                publishedAt: $publishedAt,
            );
            $manager->persist($realization);
        }
    }
}
