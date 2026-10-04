<?php

declare(strict_types=1);

namespace App\Observability;

use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Journal des actions des utilisateurs (événements `audit`, nommés `domaine.action`) : debug et
 * support. Un appel = une ligne `type=audit`, aucune logique métier. L'auteur (`user_id`) vient du
 * contexte de requête ; jamais d'e-mail, de nom, de message saisi ni de jeton dans `props`.
 */
final class AuditLogger
{
    public function __construct(
        #[Autowire(service: 'monolog.logger.audit')]
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @param array<string, scalar|list<scalar>|null> $props
     * @param string|null $userId auteur, quand il n'est pas encore dans le contexte de sécurité
     *                            (connexion) ; sinon le processeur l'ajoute seul
     */
    public function record(string $event, array $props = [], ?string $userId = null): void
    {
        $context = ['event' => $event, 'props' => array_filter($props, static fn ($v): bool => $v !== null)];
        if ($userId !== null) {
            $context['user_id'] = $userId;
        }
        $this->logger->info($event, $context);
    }
}
