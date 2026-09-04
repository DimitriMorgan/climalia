<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Ajout d'un contact (compte CLIENT) à une entreprise cliente existante.
 * Le mot de passe est requis (validé dans le contrôleur).
 */
final readonly class ContactInput
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

        #[Assert\Length(min: 6, max: 200)]
        public ?string $password = null,
    ) {
    }
}
