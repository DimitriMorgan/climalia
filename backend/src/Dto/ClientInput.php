<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\ClientSegment;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Création / édition d'une entreprise cliente par l'admin administratif.
 * À la création, un contact initial (email/prénom/nom/mot de passe) est requis
 * — validé dans le contrôleur. En édition, seuls les champs entreprise comptent.
 */
final readonly class ClientInput
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(min: 1, max: 180)]
        public string $name,

        public ClientSegment $segment,

        #[Assert\Length(max: 100)]
        public ?string $region = null,

        #[Assert\Email]
        #[Assert\Length(max: 180)]
        public ?string $contactEmail = null,

        #[Assert\Length(max: 100)]
        public ?string $contactFirstName = null,

        #[Assert\Length(max: 100)]
        public ?string $contactLastName = null,

        #[Assert\Length(min: 6, max: 200)]
        public ?string $password = null,
    ) {
    }
}
