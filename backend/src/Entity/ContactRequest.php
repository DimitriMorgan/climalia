<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\ContactStatus;
use App\Enum\ProjectType;
use App\Repository\ContactRequestRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ContactRequestRepository::class)]
#[ORM\Table(name: 'contact_requests')]
class ContactRequest
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column(length: 200)]
    private string $fullName;

    #[ORM\Column(length: 180)]
    private string $email;

    #[ORM\Column(length: 30)]
    private string $phone;

    #[ORM\Column(length: 10)]
    private string $postalCode;

    #[ORM\Column(type: 'string', enumType: ProjectType::class, length: 32)]
    private ProjectType $projectType;

    #[ORM\Column(nullable: true)]
    private ?int $surface = null;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?DateTimeImmutable $deadline = null;

    #[ORM\Column(type: 'text')]
    private string $message;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'string', enumType: ContactStatus::class, length: 32)]
    private ContactStatus $status;

    public function __construct(
        string $fullName,
        string $email,
        string $phone,
        string $postalCode,
        ProjectType $projectType,
        string $message,
        ?int $surface = null,
        ?DateTimeImmutable $deadline = null,
    ) {
        $this->id = Uuid::v7();
        $this->fullName = $fullName;
        $this->email = strtolower($email);
        $this->phone = $phone;
        $this->postalCode = $postalCode;
        $this->projectType = $projectType;
        $this->message = $message;
        $this->surface = $surface;
        $this->deadline = $deadline;
        $this->createdAt = new DateTimeImmutable();
        $this->status = ContactStatus::NEW;
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getFullName(): string
    {
        return $this->fullName;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getPhone(): string
    {
        return $this->phone;
    }

    public function getPostalCode(): string
    {
        return $this->postalCode;
    }

    public function getProjectType(): ProjectType
    {
        return $this->projectType;
    }

    public function getSurface(): ?int
    {
        return $this->surface;
    }

    public function getDeadline(): ?DateTimeImmutable
    {
        return $this->deadline;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getStatus(): ContactStatus
    {
        return $this->status;
    }

    public function setStatus(ContactStatus $status): void
    {
        $this->status = $status;
    }
}
