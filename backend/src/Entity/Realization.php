<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\EquipmentType;
use App\Enum\RealizationType;
use App\Repository\RealizationRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: RealizationRepository::class)]
#[ORM\Table(name: 'realizations')]
class Realization
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column(length: 255)]
    private string $title;

    #[ORM\Column(type: 'text')]
    private string $description;

    #[ORM\Column(type: 'string', enumType: RealizationType::class, length: 32)]
    private RealizationType $type;

    #[ORM\Column(type: 'string', enumType: EquipmentType::class, length: 32)]
    private EquipmentType $equipmentType;

    #[ORM\Column(length: 100)]
    private string $region;

    #[ORM\Column(length: 1024, nullable: true)]
    private ?string $beforeImageUrl = null;

    #[ORM\Column(length: 1024, nullable: true)]
    private ?string $afterImageUrl = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $publishedAt;

    public function __construct(
        string $title,
        string $description,
        RealizationType $type,
        EquipmentType $equipmentType,
        string $region,
        ?string $beforeImageUrl = null,
        ?string $afterImageUrl = null,
        ?DateTimeImmutable $publishedAt = null,
    ) {
        $this->id = Uuid::v7();
        $this->title = $title;
        $this->description = $description;
        $this->type = $type;
        $this->equipmentType = $equipmentType;
        $this->region = $region;
        $this->beforeImageUrl = $beforeImageUrl;
        $this->afterImageUrl = $afterImageUrl;
        $this->publishedAt = $publishedAt ?? new DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getType(): RealizationType
    {
        return $this->type;
    }

    public function getEquipmentType(): EquipmentType
    {
        return $this->equipmentType;
    }

    public function getRegion(): string
    {
        return $this->region;
    }

    public function getBeforeImageUrl(): ?string
    {
        return $this->beforeImageUrl;
    }

    public function getAfterImageUrl(): ?string
    {
        return $this->afterImageUrl;
    }

    public function getPublishedAt(): DateTimeImmutable
    {
        return $this->publishedAt;
    }

    public function setTitle(string $title): void
    {
        $this->title = $title;
    }

    public function setDescription(string $description): void
    {
        $this->description = $description;
    }

    public function setType(RealizationType $type): void
    {
        $this->type = $type;
    }

    public function setEquipmentType(EquipmentType $equipmentType): void
    {
        $this->equipmentType = $equipmentType;
    }

    public function setRegion(string $region): void
    {
        $this->region = $region;
    }

    public function setBeforeImageUrl(?string $beforeImageUrl): void
    {
        $this->beforeImageUrl = $beforeImageUrl;
    }

    public function setAfterImageUrl(?string $afterImageUrl): void
    {
        $this->afterImageUrl = $afterImageUrl;
    }

    public function setPublishedAt(DateTimeImmutable $publishedAt): void
    {
        $this->publishedAt = $publishedAt;
    }
}
