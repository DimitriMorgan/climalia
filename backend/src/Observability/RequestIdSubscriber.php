<?php

declare(strict_types=1);

namespace App\Observability;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Uid\Uuid;

/**
 * Identifiant de corrélation : un `X-Request-Id` UUID valide envoyé par le client est repris, sinon
 * on en génère un (UUIDv7). Il est renvoyé dans l'en-tête de réponse, donc visible aussi dans les
 * logs d'accès Caddy (resp_headers) → corrélation Caddy ↔ application.
 */
final class RequestIdSubscriber implements EventSubscriberInterface
{
    public const ATTRIBUTE = '_request_id';
    private const UUID = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onRequest', 4096],
            KernelEvents::RESPONSE => ['onResponse', -4096],
        ];
    }

    public function onRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }
        $request = $event->getRequest();
        $header = (string) $request->headers->get('X-Request-Id', '');
        $request->attributes->set(
            self::ATTRIBUTE,
            preg_match(self::UUID, $header) === 1 ? strtolower($header) : Uuid::v7()->toRfc4122(),
        );
    }

    public function onResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }
        $id = $event->getRequest()->attributes->get(self::ATTRIBUTE);
        if (\is_string($id)) {
            $event->getResponse()->headers->set('X-Request-Id', $id);
        }
    }
}
