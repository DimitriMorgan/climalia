<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\EquipmentType;
use App\Enum\RealizationType;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class RealizationInput
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(min: 2, max: 255)]
        public string $title,

        #[Assert\NotBlank]
        #[Assert\Length(min: 2, max: 5000)]
        public string $description,

        public RealizationType $type,

        public EquipmentType $equipmentType,

        #[Assert\NotBlank]
        #[Assert\Length(min: 2, max: 100)]
        public string $region,

        // URL absolue (https://…) ou chemin relatif servi par l'app (/uploads/…).
        // Le scheme est restreint pour bloquer les sinks javascript:/data: (defense-in-depth).
        #[Assert\Length(max: 1024)]
        #[Assert\Regex(pattern: '#^(/uploads/|https?://)#', message: 'beforeImageUrl doit être un chemin /uploads/… ou une URL http(s).')]
        public ?string $beforeImageUrl = null,

        #[Assert\Length(max: 1024)]
        #[Assert\Regex(pattern: '#^(/uploads/|https?://)#', message: 'afterImageUrl doit être un chemin /uploads/… ou une URL http(s).')]
        public ?string $afterImageUrl = null,

        // Date ISO (YYYY-MM-DD ou datetime). Défaut = maintenant si absente.
        public ?string $publishedAt = null,
    ) {
    }
}
