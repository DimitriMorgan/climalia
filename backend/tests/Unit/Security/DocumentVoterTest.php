<?php

declare(strict_types=1);

namespace App\Tests\Unit\Security;

use App\Entity\Document;
use App\Entity\User;
use App\Enum\DocumentCategory;
use App\Enum\UserRole;
use App\Security\DocumentVoter;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Authorization\Voter\VoterInterface;

final class DocumentVoterTest extends TestCase
{
    private DocumentVoter $voter;

    protected function setUp(): void
    {
        $this->voter = new DocumentVoter();
    }

    #[Test]
    public function admin_voit_tout(): void
    {
        $admin = $this->createUser(UserRole::ADMIN);
        $owner = $this->createUser(UserRole::EMPLOYEE);
        $document = $this->createDocument($owner, []);

        $this->assertGranted($admin, $document);
    }

    #[Test]
    public function employee_voit_son_propre_document(): void
    {
        $employee = $this->createUser(UserRole::EMPLOYEE);
        $document = $this->createDocument($employee, []);

        $this->assertGranted($employee, $document);
    }

    #[Test]
    public function employee_voit_document_avec_role_employee_dans_visible_to_roles(): void
    {
        $employee = $this->createUser(UserRole::EMPLOYEE);
        $other = $this->createUser(UserRole::ADMIN);
        $document = $this->createDocument($other, [UserRole::EMPLOYEE]);

        $this->assertGranted($employee, $document);
    }

    #[Test]
    public function employee_ne_voit_pas_document_partner_only(): void
    {
        $employee = $this->createUser(UserRole::EMPLOYEE);
        $other = $this->createUser(UserRole::ADMIN);
        $document = $this->createDocument($other, [UserRole::PARTNER]);

        $this->assertDenied($employee, $document);
    }

    #[Test]
    public function partner_voit_son_propre_document(): void
    {
        $partner = $this->createUser(UserRole::PARTNER);
        $document = $this->createDocument($partner, []);

        $this->assertGranted($partner, $document);
    }

    #[Test]
    public function partner_voit_document_avec_role_partner(): void
    {
        $partner = $this->createUser(UserRole::PARTNER);
        $other = $this->createUser(UserRole::ADMIN);
        $document = $this->createDocument($other, [UserRole::PARTNER]);

        $this->assertGranted($partner, $document);
    }

    #[Test]
    public function partner_ne_voit_pas_document_employee_only(): void
    {
        $partner = $this->createUser(UserRole::PARTNER);
        $other = $this->createUser(UserRole::EMPLOYEE);
        $document = $this->createDocument($other, [UserRole::EMPLOYEE]);

        $this->assertDenied($partner, $document);
    }

    #[Test]
    public function unauthenticated_token_est_refuse(): void
    {
        $document = $this->createDocument($this->createUser(UserRole::ADMIN), [UserRole::EMPLOYEE, UserRole::PARTNER]);

        $token = $this->createStub(TokenInterface::class);
        $token->method('getUser')->willReturn(null);

        $result = $this->voter->vote($token, $document, [DocumentVoter::VIEW]);
        self::assertSame(VoterInterface::ACCESS_DENIED, $result);
    }

    private function createUser(UserRole $role): User
    {
        return new User(
            email: 'user-' . $role->value . '@climalia.test',
            passwordHash: 'hash',
            role: $role,
            firstName: 'Test',
            lastName: ucfirst(strtolower($role->value)),
        );
    }

    /**
     * @param list<UserRole> $visibleToRoles
     */
    private function createDocument(User $owner, array $visibleToRoles): Document
    {
        return new Document(
            title: 'Doc',
            category: DocumentCategory::INTERNAL_DOC,
            fileUrl: 'https://files.test/doc.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 1024,
            ownerUser: $owner,
            visibleToRoles: $visibleToRoles,
        );
    }

    private function assertGranted(User $user, Document $document): void
    {
        $token = new UsernamePasswordToken($user, 'main', $user->getRoles());
        $result = $this->voter->vote($token, $document, [DocumentVoter::VIEW]);
        self::assertSame(VoterInterface::ACCESS_GRANTED, $result);
    }

    private function assertDenied(User $user, Document $document): void
    {
        $token = new UsernamePasswordToken($user, 'main', $user->getRoles());
        $result = $this->voter->vote($token, $document, [DocumentVoter::VIEW]);
        self::assertSame(VoterInterface::ACCESS_DENIED, $result);
    }
}
