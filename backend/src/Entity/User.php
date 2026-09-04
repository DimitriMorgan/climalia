<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\UserRole;
use App\Repository\UserRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\HasLifecycleCallbacks]
#[ORM\UniqueConstraint(name: 'uniq_users_email', columns: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $id;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank]
    #[Assert\Email]
    private string $email;

    #[ORM\Column(length: 255)]
    private string $passwordHash;

    #[ORM\Column(type: 'string', enumType: UserRole::class, length: 32)]
    private UserRole $role;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    private string $firstName;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    private string $lastName;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $region = null;

    /** Entreprise cliente de rattachement — pour les comptes CLIENT uniquement. */
    #[ORM\ManyToOne(targetEntity: Client::class)]
    #[ORM\JoinColumn(name: 'client_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?Client $client = null;

    /** Compte désactivé = connexion refusée (cf. App\Security\UserChecker). */
    #[ORM\Column(options: ['default' => true])]
    private bool $active = true;

    /** Contacts clients : reçoit les e-mails de notification de nouveaux documents. */
    #[ORM\Column(options: ['default' => true])]
    private bool $notifyOnNewDocument = true;

    #[ORM\Column(type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    public function __construct(
        string $email,
        string $passwordHash,
        UserRole $role,
        string $firstName,
        string $lastName,
        ?string $region = null,
        ?Client $client = null,
    ) {
        $this->id = Uuid::v7();
        $this->email = strtolower($email);
        $this->passwordHash = $passwordHash;
        $this->role = $role;
        $this->firstName = $firstName;
        $this->lastName = $lastName;
        $this->region = $region;
        $this->client = $client;
        $this->createdAt = new DateTimeImmutable();
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): void
    {
        $this->email = strtolower($email);
    }

    public function getPasswordHash(): string
    {
        return $this->passwordHash;
    }

    public function setPasswordHash(string $passwordHash): void
    {
        $this->passwordHash = $passwordHash;
    }

    public function getRoleEnum(): UserRole
    {
        return $this->role;
    }

    public function setRoleEnum(UserRole $role): void
    {
        $this->role = $role;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): void
    {
        $this->firstName = $firstName;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): void
    {
        $this->lastName = $lastName;
    }

    public function getRegion(): ?string
    {
        return $this->region;
    }

    public function setRegion(?string $region): void
    {
        $this->region = $region;
    }

    public function getClient(): ?Client
    {
        return $this->client;
    }

    public function setClient(?Client $client): void
    {
        $this->client = $client;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): void
    {
        $this->active = $active;
    }

    public function isNotifyOnNewDocument(): bool
    {
        return $this->notifyOnNewDocument;
    }

    public function setNotifyOnNewDocument(bool $notify): void
    {
        $this->notifyOnNewDocument = $notify;
    }

    /**
     * @return list<string>
     */
    public function getRoles(): array
    {
        return [$this->role->asSecurityRole()];
    }

    public function getPassword(): string
    {
        return $this->passwordHash;
    }

    public function getUserIdentifier(): string
    {
        // Email est posé non-vide par le constructeur ; PHPStan attend
        // explicitement un non-empty-string.
        return $this->email !== '' ? $this->email : 'unknown';
    }

    public function eraseCredentials(): void
    {
        // Nothing to erase: we don't store plain credentials.
    }
}
