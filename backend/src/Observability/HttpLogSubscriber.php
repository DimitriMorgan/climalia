<?php

declare(strict_types=1);

namespace App\Observability;

use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * UNE ligne `type=http` par requête, après l'envoi de la réponse : méthode, route en TEMPLATE
 * (`/api/sessions/{token}`, jamais la valeur), statut, durée. Ni corps, ni en-têtes, ni IP (déjà
 * dans les logs Caddy). Healthchecks, profiler et barre de debug exclus.
 */
final class HttpLogSubscriber implements EventSubscriberInterface
{
    private const SKIPPED_ROUTES = ['_wdt', '_profiler', '_profiler_home', 'health', 'api_health'];

    public function __construct(
        #[Autowire(service: 'monolog.logger.http')]
        private readonly LoggerInterface $logger,
        private readonly ?Security $security = null,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::TERMINATE => ['onTerminate', -1024]];
    }

    public function onTerminate(TerminateEvent $event): void
    {
        $request = $event->getRequest();
        $route = $request->attributes->get('_route');
        if (\is_string($route) && (\in_array($route, self::SKIPPED_ROUTES, true) || str_starts_with($route, '_profiler'))) {
            return;
        }
        $status = $event->getResponse()->getStatusCode();
        $template = \is_string($route) ? self::template($request) : 'unmatched';
        $started = (float) $request->server->get('REQUEST_TIME_FLOAT', microtime(true));
        // Au terminate, la requête a quitté la RequestStack : le ContextProcessor ne la voit plus. On
        // pose donc request_id et user_id ici, depuis la requête et le jeton de sécurité.
        $context = [];
        $requestId = $request->attributes->get(RequestIdSubscriber::ATTRIBUTE);
        if (\is_string($requestId)) {
            $context['request_id'] = $requestId;
        }
        try {
            $user = $this->security?->getUser();
            if ($user !== null && method_exists($user, 'getId')) {
                $context['user_id'] = (string) $user->getId();
            }
        } catch (\Throwable) {
        }
        $context += [
            'http' => [
                'method' => $request->getMethod(),
                'route' => $template,
                'status' => $status,
                'duration_ms' => (int) round((microtime(true) - $started) * 1000),
            ],
        ];
        $message = \sprintf('%s %s %d', $request->getMethod(), $template, $status);
        $status >= 500 ? $this->logger->error($message, $context) : $this->logger->info($message, $context);
    }

    /** Chemin de la requête où chaque valeur de paramètre de route redevient `{nom}`. */
    public static function template(Request $request): string
    {
        $path = $request->getPathInfo();
        $params = $request->attributes->get('_route_params', []);
        if (\is_array($params)) {
            // Les valeurs les plus longues d'abord : « abc » ne doit pas mordre dans « abcdef ».
            uasort($params, static fn ($a, $b): int => \strlen((string) (\is_scalar($b) ? $b : '')) <=> \strlen((string) (\is_scalar($a) ? $a : '')));
            foreach ($params as $name => $value) {
                if (\is_string($name) && \is_scalar($value) && (string) $value !== '') {
                    $path = preg_replace('#(?<=/)'.preg_quote((string) $value, '#').'(?=/|$)#', '{'.$name.'}', $path, 1) ?? $path;
                }
            }
        }

        return $path;
    }
}
