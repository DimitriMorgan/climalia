<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ContactRequest;
use App\Entity\User;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Envoi de la réponse d'un administrateur à une demande de devis.
 * L'expéditeur technique est no-reply, mais le Reply-To pointe vers
 * l'administrateur qui répond : le prospect peut répondre directement.
 *
 * Le transport réel dépend de MAILER_DSN (null:// = aucun envoi).
 */
final class ContactReplyMailer
{
    private const FROM_EMAIL = 'no-reply@climalia.fr';
    private const FROM_NAME = 'Climalia';

    public function __construct(
        private readonly MailerInterface $mailer,
    ) {
    }

    public function sendReply(ContactRequest $contact, string $subject, string $message, User $admin): void
    {
        $email = (new Email())
            ->from(new Address(self::FROM_EMAIL, self::FROM_NAME))
            ->to(new Address($contact->getEmail(), $contact->getFullName()))
            ->replyTo(new Address(
                $admin->getEmail(),
                trim($admin->getFirstName() . ' ' . $admin->getLastName()) . ' — Climalia',
            ))
            ->subject($subject)
            ->text($message);

        $this->mailer->send($email);
    }
}
