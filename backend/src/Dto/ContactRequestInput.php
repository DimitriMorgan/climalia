<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\ProjectType;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class ContactRequestInput
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(min: 2, max: 200)]
        public string $fullName,

        #[Assert\NotBlank]
        #[Assert\Email]
        public string $email,

        #[Assert\NotBlank]
        #[Assert\Length(min: 6, max: 30)]
        public string $phone,

        #[Assert\NotBlank]
        #[Assert\Regex(pattern: '/^\d{5}$/', message: 'postalCode doit contenir 5 chiffres.')]
        public string $postalCode,

        public ProjectType $projectType,

        #[Assert\NotBlank]
        #[Assert\Length(min: 5, max: 5000)]
        public string $message,

        #[Assert\Positive]
        #[Assert\LessThan(100000)]
        public ?int $surface = null,

        public ?string $deadline = null,
    ) {
    }
}
