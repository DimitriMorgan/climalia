<?php

declare(strict_types=1);

namespace App\Observability;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Http\Authenticator\JsonLoginAuthenticator;
use Symfony\Component\Security\Http\Event\LoginFailureEvent;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;

/**
 * Connexions dans le journal d'audit. Seul le formulaire de connexion compte : l'authentification
 * par JWT, qui réussit à CHAQUE appel d'API, n'est pas une connexion. Un échec ne journalise jamais
 * l'identifiant tapé (e-mail), seulement la raison. (Déconnexion : côté client, JWT sans état.)
 */
final class SecurityAuditSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            LoginSuccessEvent::class => 'onLoginSuccess',
            LoginFailureEvent::class => 'onLoginFailure',
        ];
    }

    public function onLoginSuccess(LoginSuccessEvent $event): void
    {
        if (!$event->getAuthenticator() instanceof JsonLoginAuthenticator) {
            return;
        }
        $user = $event->getUser();
        $this->audit->record('auth.login', ['method' => 'password'], method_exists($user, 'getId') ? (string) $user->getId() : null);
    }

    public function onLoginFailure(LoginFailureEvent $event): void
    {
        if (!$event->getAuthenticator() instanceof JsonLoginAuthenticator) {
            return;
        }
        $this->audit->record('auth.login_failed', ['reason' => $event->getException()->getMessageKey()]);
    }
}
