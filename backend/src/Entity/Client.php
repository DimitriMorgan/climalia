<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\ClientSegment;
use App\Repository\ClientRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Entreprise cliente (raison sociale + segment). Plusieurs comptes {@see User}
 * de rôle CLIENT peuvent y être rattachés ; les documents livrables sont
 * affectés à l'entreprise, pas à un contact en particulier.
 */
#[ORM\Entity(repositoryClass: ClientRepository::class)]
#[ORM\Table(name: 'clients')]
class Client
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank]
    private string $name;

    #[ORM\Column(type: 'string', enumType: ClientSegment::class, length: 32)]
    private ClientSegment $segment;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $region = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    public function __construct(string $name, ClientSegment $segment, ?string $region = null)
    {
        $this->id = Uuid::v7();
        $this->name = $name;
        $this->segment = $segment;
        $this->region = $region;
        $this->createdAt = new DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getSegment(): ClientSegment
    {
        return $this->segment;
    }

    public function setSegment(ClientSegment $segment): void
    {
        $this->segment = $segment;
    }

    public function getRegion(): ?string
    {
        return $this->region;
    }

    public function setRegion(?string $region): void
    {
        $this->region = $region;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }
}
