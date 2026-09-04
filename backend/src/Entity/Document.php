<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\DocumentAudience;
use App\Enum\DocumentCategory;
use App\Enum\UserRole;
use App\Repository\DocumentRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: DocumentRepository::class)]
#[ORM\Table(name: 'documents')]
class Document
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private string $title;

    #[ORM\Column(type: 'string', enumType: DocumentCategory::class, length: 64)]
    private DocumentCategory $category;

    /** INTERNAL = ressource interne/partagée (rôle/région) ; CLIENT = livrable affecté à des entreprises. */
    #[ORM\Column(type: 'string', enumType: DocumentAudience::class, length: 16)]
    private DocumentAudience $audience = DocumentAudience::INTERNAL;

    /** URL externe (docs hérités/distants). Les fichiers uploadés utilisent storagePath. */
    #[ORM\Column(length: 1024, nullable: true)]
    private ?string $fileUrl = null;

    /** Chemin de stockage privé (hors public/) pour les fichiers réellement uploadés. */
    #[ORM\Column(length: 1024, nullable: true)]
    private ?string $storagePath = null;

    #[ORM\Column(length: 128)]
    private string $mimeType;

    #[ORM\Column]
    private int $sizeBytes;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $uploadedAt;

    /**
     * Date « métier » du document (échéance, date d'intervention, période du
     * planning…), distincte de la date d'upload. Alimente le calendrier admin.
     */
    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?DateTimeImmutable $documentDate = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'owner_user_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $ownerUser = null;

    /**
     * Liste de rôles autorisés. Stocké en JSON (array de string-values d'UserRole).
     *
     * @var list<string>
     */
    #[ORM\Column(type: 'json')]
    private array $visibleToRoles = [];

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $region = null;

    /**
     * Entreprises clientes auxquelles ce document a été affecté (dispatch).
     *
     * @var Collection<int, Client>
     */
    #[ORM\ManyToMany(targetEntity: Client::class)]
    #[ORM\JoinTable(name: 'document_assigned_clients')]
    private Collection $assignedClients;

    /**
     * @param list<UserRole> $visibleToRoles
     */
    public function __construct(
        string $title,
        DocumentCategory $category,
        ?string $fileUrl,
        string $mimeType,
        int $sizeBytes,
        ?User $ownerUser = null,
        array $visibleToRoles = [],
        ?string $region = null,
        DocumentAudience $audience = DocumentAudience::INTERNAL,
    ) {
        $this->id = Uuid::v7();
        $this->title = $title;
        $this->category = $category;
        $this->fileUrl = $fileUrl;
        $this->mimeType = $mimeType;
        $this->sizeBytes = $sizeBytes;
        $this->ownerUser = $ownerUser;
        $this->visibleToRoles = array_map(static fn (UserRole $r): string => $r->value, $visibleToRoles);
        $this->region = $region;
        $this->audience = $audience;
        $this->assignedClients = new ArrayCollection();
        $this->uploadedAt = new DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getCategory(): DocumentCategory
    {
        return $this->category;
    }

    public function getFileUrl(): ?string
    {
        return $this->fileUrl;
    }

    public function setFileUrl(?string $fileUrl): void
    {
        $this->fileUrl = $fileUrl;
    }

    public function getMimeType(): string
    {
        return $this->mimeType;
    }

    public function getSizeBytes(): int
    {
        return $this->sizeBytes;
    }

    public function setSizeBytes(int $sizeBytes): void
    {
        $this->sizeBytes = $sizeBytes;
    }

    public function getUploadedAt(): DateTimeImmutable
    {
        return $this->uploadedAt;
    }

    public function getDocumentDate(): ?DateTimeImmutable
    {
        return $this->documentDate;
    }

    public function setDocumentDate(?DateTimeImmutable $documentDate): void
    {
        $this->documentDate = $documentDate;
    }

    public function getOwnerUser(): ?User
    {
        return $this->ownerUser;
    }

    public function setOwnerUser(?User $ownerUser): void
    {
        $this->ownerUser = $ownerUser;
    }

    /**
     * @return list<UserRole>
     */
    public function getVisibleToRoles(): array
    {
        $roles = [];
        foreach ($this->visibleToRoles as $value) {
            $role = UserRole::tryFrom($value);
            if ($role !== null) {
                $roles[] = $role;
            }
        }

        return $roles;
    }

    public function isVisibleTo(UserRole $role): bool
    {
        return in_array($role->value, $this->visibleToRoles, true);
    }

    /**
     * @param list<UserRole> $roles
     */
    public function setVisibleToRoles(array $roles): void
    {
        $this->visibleToRoles = array_values(array_map(static fn (UserRole $r): string => $r->value, $roles));
    }

    public function getRegion(): ?string
    {
        return $this->region;
    }

    public function setRegion(?string $region): void
    {
        $this->region = $region;
    }

    public function getStoragePath(): ?string
    {
        return $this->storagePath;
    }

    public function setStoragePath(?string $storagePath): void
    {
        $this->storagePath = $storagePath;
    }

    public function getAudience(): DocumentAudience
    {
        return $this->audience;
    }

    public function setAudience(DocumentAudience $audience): void
    {
        $this->audience = $audience;
    }

    /**
     * @return Collection<int, Client>
     */
    public function getAssignedClients(): Collection
    {
        return $this->assignedClients;
    }

    public function addAssignedClient(Client $client): void
    {
        if (!$this->assignedClients->contains($client)) {
            $this->assignedClients->add($client);
        }
    }

    public function removeAssignedClient(Client $client): void
    {
        $this->assignedClients->removeElement($client);
    }

    public function clearAssignedClients(): void
    {
        $this->assignedClients->clear();
    }

    public function isAssignedToClient(Client $client): bool
    {
        foreach ($this->assignedClients as $assigned) {
            if ($assigned->getId()->equals($client->getId())) {
                return true;
            }
        }

        return false;
    }
}
