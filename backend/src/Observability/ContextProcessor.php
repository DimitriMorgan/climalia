<?php

declare(strict_types=1);

namespace App\Observability;

use Monolog\Attribute\AsMonologProcessor;
use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Ajoute `request_id` et `user_id` (identifiant INTERNE, jamais l'e-mail) à chaque log émis pendant
 * une requête HTTP. Hors requête (commande, cron) : rien.
 */
#[AsMonologProcessor]
final class ContextProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly RequestStack $requests,
        private readonly Security $security,
    ) {
    }

    public function __invoke(LogRecord $record): LogRecord
    {
        $request = $this->requests->getMainRequest();
        if ($request === null) {
            return $record;
        }
        $extra = $record->extra;
        $id = $request->attributes->get(RequestIdSubscriber::ATTRIBUTE);
        if (\is_string($id)) {
            $extra['request_id'] = $id;
        }
        try {
            $user = $this->security->getUser();
            if ($user !== null && method_exists($user, 'getId')) {
                $extra['user_id'] = (string) $user->getId();
            }
        } catch (\Throwable) {
            // Pas de contexte de sécurité (début de requête, erreur de pare-feu) : on s'en passe.
        }

        return $record->with(extra: $extra);
    }
}
