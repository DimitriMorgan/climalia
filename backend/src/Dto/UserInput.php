<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\UserRole;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Création / édition d'un compte interne (salarié, éditeur, admin, partenaire)
 * par l'admin administratif. Les comptes CLIENT se gèrent via /api/clients.
 * Le mot de passe est requis à la création, optionnel en édition (réinitialisation).
 */
final readonly class UserInput
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Email]
        #[Assert\Length(max: 180)]
        public string $email,

        #[Assert\NotBlank]
        #[Assert\Length(min: 1, max: 100)]
        public string $firstName,

        #[Assert\NotBlank]
        #[Assert\Length(min: 1, max: 100)]
        public string $lastName,

        public UserRole $role,

        #[Assert\Length(max: 100)]
        public ?string $region = null,

        #[Assert\Length(min: 6, max: 200)]
        public ?string $password = null,
    ) {
    }
}
