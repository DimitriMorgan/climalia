<?php

declare(strict_types=1);

namespace App\Observability;

use Monolog\Formatter\FormatterInterface;
use Monolog\Level;
use Monolog\LogRecord;

/**
 * Une ligne JSON par événement, au contrat de logs de l'observabilité du VPS
 * (~/projects/observability/docs/OBSERVABILITY.md), collectée par Alloy → Loki :
 *
 *   {"ts":"…Z","level":"info","app":"gomanger","service":"app","env":"prod","type":"http",
 *    "msg":"…","request_id":"…","user_id":"…","http":{…},"event":"…","props":{…},"err":{…}}
 *
 * `type` découle du canal Monolog : http, audit, external, sinon app. Une exception devient `err`
 * (type, message, pile) sur UNE ligne — jamais de log multi-lignes. Les clés sensibles (mot de
 * passe, jeton, e-mail, adresse, nom…) sont masquées où qu'elles soient : filet de sécurité, la
 * règle restant de ne jamais passer ces données au logger.
 */
final class ContractJsonFormatter implements FormatterInterface
{
    private const SENSITIVE = [
        'password', 'plainpassword', 'token', 'accesstoken', 'refreshtoken', 'authorization', 'cookie',
        'email', 'address', 'name', 'firstname', 'lastname', 'pseudo', 'ip', 'phone', 'secret',
    ];

    public function __construct(
        private readonly string $app,
        private readonly string $service,
        private readonly string $env,
    ) {
    }

    public function format(LogRecord $record): string
    {
        $context = $record->context;
        $extra = $record->extra;

        $line = [
            'ts' => $record->datetime->setTimezone(new \DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z'),
            'level' => self::level($record->level),
            'app' => $this->app,
            'service' => $this->service,
            'env' => $this->env === 'prod' ? 'prod' : $this->env,
            'type' => match ($record->channel) {
                'http' => 'http',
                'audit' => 'audit',
                'external' => 'external',
                default => 'app',
            },
            'msg' => $record->message,
        ];
        foreach (['request_id', 'user_id'] as $key) {
            if (isset($extra[$key]) && \is_string($extra[$key]) && $extra[$key] !== '') {
                $line[$key] = $extra[$key];
            }
        }
        // Valeurs explicites (ligne http écrite au terminate, connexion…) : prioritaires.
        foreach (['request_id', 'user_id'] as $key) {
            if (isset($context[$key]) && \is_string($context[$key]) && $context[$key] !== '') {
                $line[$key] = $context[$key];
            }
            unset($context[$key]);
        }
        // Ordre stable des clés du contrat.
        $line = array_merge(array_intersect_key(['ts' => 0, 'level' => 0, 'app' => 0, 'service' => 0, 'env' => 0, 'type' => 0, 'msg' => 0, 'request_id' => 0, 'user_id' => 0], $line), $line);

        foreach (['http', 'event'] as $key) {
            if (\array_key_exists($key, $context)) {
                $line[$key] = $context[$key];
                unset($context[$key]);
            }
        }
        $exception = $context['exception'] ?? null;
        unset($context['exception']);
        if ($exception instanceof \Throwable) {
            $line['err'] = self::error($exception);
        } elseif (\is_string($exception) && $exception !== '') {
            $line['err'] = ['type' => 'Error', 'message' => $exception];
        }

        $props = $context['props'] ?? null;
        unset($context['props']);
        $props = \is_array($props) ? $props + $context : $context;
        if ($record->channel !== 'app' && !\in_array($line['type'], ['http', 'audit', 'external'], true)) {
            $props['channel'] = $record->channel;
        }
        if ($props !== []) {
            $line['props'] = self::redact($props);
        }

        return json_encode(
            $line,
            \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE | \JSON_INVALID_UTF8_SUBSTITUTE | \JSON_PRESERVE_ZERO_FRACTION | \JSON_PARTIAL_OUTPUT_ON_ERROR,
        )."\n";
    }

    public function formatBatch(array $records): string
    {
        return implode('', array_map($this->format(...), $records));
    }

    private static function level(Level $level): string
    {
        return match (true) {
            $level->value >= Level::Error->value => 'error',
            $level === Level::Warning => 'warn',
            $level === Level::Debug => 'debug',
            default => 'info',
        };
    }

    /** @return array{type: string, message: string, stack: string} */
    private static function error(\Throwable $e): array
    {
        $stack = \sprintf("%s: %s at %s:%d\n%s", $e::class, $e->getMessage(), $e->getFile(), $e->getLine(), $e->getTraceAsString());
        for ($previous = $e->getPrevious(); $previous !== null; $previous = $previous->getPrevious()) {
            $stack .= \sprintf("\nCaused by %s: %s at %s:%d", $previous::class, $previous->getMessage(), $previous->getFile(), $previous->getLine());
        }

        return ['type' => $e::class, 'message' => mb_substr($e->getMessage(), 0, 1000), 'stack' => mb_substr($stack, 0, 8000)];
    }

    /**
     * @param array<array-key, mixed> $data
     *
     * @return array<array-key, mixed>
     */
    private static function redact(array $data, int $depth = 0): array
    {
        foreach ($data as $key => $value) {
            if (\is_string($key) && \in_array(strtolower(str_replace(['_', '-'], '', $key)), self::SENSITIVE, true)) {
                $data[$key] = '[REDACTED]';
            } elseif (\is_array($value)) {
                $data[$key] = $depth < 4 ? self::redact($value, $depth + 1) : '[…]';
            } elseif ($value instanceof \Throwable) {
                $data[$key] = self::error($value);
            } elseif (\is_object($value)) {
                $data[$key] = $value instanceof \Stringable ? (string) $value : $value::class;
            }
        }

        return $data;
    }
}
