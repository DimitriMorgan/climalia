<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Client;
use App\Entity\Document;
use App\Entity\User;
use App\Enum\UserRole;
use App\Repository\UserRepository;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

/**
 * Notification e-mail des contacts clients quand un livrable leur est déposé
 * ou affecté. Destinataires : les contacts CLIENT de chaque entreprise dont le
 * flag « notifyOnNewDocument » est actif ET dont le compte peut se connecter
 * (un contact désactivé ne reçoit rien — l'e-mail l'invite à consulter
 * l'espace client).
 *
 * Le transport réel dépend de MAILER_DSN (null:// = aucun envoi).
 */
final class DocumentNotificationMailer
{
    private const FROM_EMAIL = 'no-reply@climalia.fr';
    private const FROM_NAME = 'Climalia';

    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly UserRepository $users,
        #[Autowire('%env(DEFAULT_URI)%')]
        private readonly string $baseUri,
    ) {
    }

    /**
     * Notifie les contacts des entreprises données. Renvoie le nombre
     * d'e-mails envoyés.
     *
     * @param list<Client> $companies
     */
    public function notifyNewDocument(Document $document, array $companies): int
    {
        $sent = 0;
        foreach ($companies as $company) {
            $contacts = $this->users->findBy(['client' => $company, 'role' => UserRole::CLIENT]);
            foreach ($contacts as $contact) {
                if (!$contact->isActive() || !$contact->isNotifyOnNewDocument()) {
                    continue;
                }
                $this->mailer->send($this->buildEmail($document, $company, $contact));
                ++$sent;
            }
        }

        return $sent;
    }

    private function buildEmail(Document $document, Client $company, User $contact): Email
    {
        $link = rtrim($this->baseUri, '/') . '/espace-pro/documents/' . $document->getId()->toRfc4122();

        $text = sprintf(
            "Bonjour %s,\n\n"
            . "Un nouveau document est disponible pour %s dans votre espace client Climalia :\n\n"
            . "    %s\n\n"
            . "Vous pouvez le consulter et le télécharger ici :\n%s\n\n"
            . "— L'équipe Climalia\n\n"
            . "Vous recevez cet e-mail car vous êtes contact de %s. "
            . "Pour ne plus recevoir ces notifications, rapprochez-vous de votre interlocuteur Climalia.",
            $contact->getFirstName(),
            $company->getName(),
            $document->getTitle(),
            $link,
            $company->getName(),
        );

        return (new Email())
            ->from(new Address(self::FROM_EMAIL, self::FROM_NAME))
            ->to(new Address($contact->getEmail(), trim($contact->getFirstName() . ' ' . $contact->getLastName())))
            ->subject('Nouveau document disponible — ' . $document->getTitle())
            ->text($text);
    }
}
