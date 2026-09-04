<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\SiteContentRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;

/**
 * Override d'une clé de contenu du site vitrine (« clé de traduction »).
 *
 * Les textes par défaut vivent côté front (`frontend/src/content/defaults.ts`) ;
 * cette table ne stocke QUE les clés modifiées par l'éditeur. Supprimer une
 * ligne = retour au texte par défaut.
 */
#[ORM\Entity(repositoryClass: SiteContentRepository::class)]
#[ORM\Table(name: 'site_content')]
#[ORM\UniqueConstraint(name: 'uniq_site_content_key', columns: ['content_key'])]
class SiteContent
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    /** Clé côté front, ex. « home.hero.title ». */
    #[ORM\Column(name: 'content_key', length: 191)]
    private string $key;

    #[ORM\Column(type: 'text')]
    private string $value;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;

    public function __construct(string $key, string $value)
    {
        $this->id = Uuid::v7();
        $this->key = $key;
        $this->value = $value;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getKey(): string
    {
        return $this->key;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function setValue(string $value): void
    {
        $this->value = $value;
        $this->updatedAt = new DateTimeImmutable();
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
