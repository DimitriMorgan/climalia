<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Service\DemoSeeder;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

/**
 * Fixtures dev/test : délèguent au {@see DemoSeeder} partagé avec la commande
 * prod `app:seed-demo`, pour garantir des données identiques des deux côtés.
 */
final class AppFixtures extends Fixture
{
    public function __construct(
        private readonly DemoSeeder $seeder,
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        // Le seeder utilise l'EntityManager injecté (même instance que $manager)
        // et flush lui-même. Idempotent : sûr même en --append.
        $this->seeder->seed();
    }
}
