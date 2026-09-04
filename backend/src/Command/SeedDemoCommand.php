<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\DemoSeeder;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Seed des comptes de démonstration en production (idempotent).
 *
 * Disponible en prod car {@see DemoSeeder} vit dans `src/` (contrairement au
 * bundle de fixtures, dépendance dev absente de l'image de prod).
 *
 * Usage : php bin/console app:seed-demo
 */
#[AsCommand(
    name: 'app:seed-demo',
    description: 'Crée les comptes de démonstration, documents et réalisations si absents (idempotent).',
)]
final class SeedDemoCommand extends Command
{
    public function __construct(
        private readonly DemoSeeder $seeder,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $result = $this->seeder->seed();

        $io->success(sprintf(
            'Seed terminé : %d compte(s), %d entreprise(s), %d document(s), %d réalisation(s), %d affectation(s), '
            . '%d demande(s) de devis créé(s), %d document(s) hérité(s) réparé(s). '
            . 'Les entités déjà présentes ont été ignorées.',
            $result['accounts'],
            $result['companies'],
            $result['documents'],
            $result['realizations'],
            $result['assignments'],
            $result['contactRequests'],
            $result['repairedDocuments'],
        ));

        if ($result['accounts'] > 0) {
            $io->note('Mot de passe des comptes de démonstration : « ' . DemoSeeder::DEMO_PASSWORD . ' »');
        }

        return Command::SUCCESS;
    }
}
