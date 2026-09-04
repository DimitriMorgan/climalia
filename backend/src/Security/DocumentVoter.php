<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\Document;
use App\Entity\User;
use App\Enum\UserRole;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Règles de visibilité d'un Document :
 *  - ADMIN : voit tout
 *  - EMPLOYEE : voit s'il est ownerUser (uploadeur), OU si visibleToRoles contient EMPLOYEE
 *  - PARTNER : voit s'il est ownerUser, OU si visibleToRoles contient PARTNER
 *  - CLIENT : voit s'il est ownerUser, OU si le document lui a été affecté (assignedClients)
 *
 * @extends Voter<string, Document>
 */
final class DocumentVoter extends Voter
{
    public const VIEW = 'document.view';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::VIEW && $subject instanceof Document;
    }

    /**
     * @param Document $subject
     */
    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        $role = $user->getRoleEnum();

        if ($role === UserRole::ADMIN) {
            return true;
        }

        $owner = $subject->getOwnerUser();
        if ($owner !== null && $owner->getId()->equals($user->getId())) {
            return true;
        }

        // Un client voit les documents affectés à SON entreprise (dispatch).
        if ($role === UserRole::CLIENT) {
            $client = $user->getClient();

            return $client !== null && $subject->isAssignedToClient($client);
        }

        // EMPLOYEE / PARTNER : ressources internes ou partagées (visibilité par rôle).
        return $subject->isVisibleTo($role);
    }
}
