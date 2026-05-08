<?php

declare(strict_types=1);

namespace App\Tests\Unit\Dto;

use App\Dto\ContactRequestInput;
use App\Enum\ProjectType;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class ContactRequestInputTest extends KernelTestCase
{
    private ValidatorInterface $validator;

    protected function setUp(): void
    {
        self::bootKernel();
        $validator = self::getContainer()->get('validator');
        self::assertInstanceOf(ValidatorInterface::class, $validator);
        $this->validator = $validator;
    }

    #[Test]
    public function valid_payload_passes(): void
    {
        $dto = new ContactRequestInput(
            fullName: 'Marie Curie',
            email: 'marie@test.fr',
            phone: '0612345678',
            postalCode: '75001',
            projectType: ProjectType::HEAT_PUMP,
            message: 'Je souhaite remplacer ma chaudière par une PAC.',
            surface: 90,
            deadline: '2026-09-01',
        );
        self::assertCount(0, $this->validator->validate($dto));
    }

    #[Test]
    public function invalid_email_fails(): void
    {
        $dto = new ContactRequestInput(
            fullName: 'Marie Curie',
            email: 'not-an-email',
            phone: '0612345678',
            postalCode: '75001',
            projectType: ProjectType::HEAT_PUMP,
            message: 'Message valide.',
        );
        $violations = $this->validator->validate($dto);
        self::assertGreaterThan(0, count($violations));
    }

    #[Test]
    public function invalid_postal_code_fails(): void
    {
        $dto = new ContactRequestInput(
            fullName: 'Marie Curie',
            email: 'marie@test.fr',
            phone: '0612345678',
            postalCode: '7500', // 4 chiffres
            projectType: ProjectType::HEAT_PUMP,
            message: 'Message valide.',
        );
        $violations = $this->validator->validate($dto);
        self::assertGreaterThan(0, count($violations));
    }

    #[Test]
    public function missing_message_fails(): void
    {
        $dto = new ContactRequestInput(
            fullName: 'Marie Curie',
            email: 'marie@test.fr',
            phone: '0612345678',
            postalCode: '75001',
            projectType: ProjectType::HEAT_PUMP,
            message: '',
        );
        $violations = $this->validator->validate($dto);
        self::assertGreaterThan(0, count($violations));
    }
}
