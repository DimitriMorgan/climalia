<?php

declare(strict_types=1);

namespace App\Tests\Unit\Observability;

use App\Observability\AuditLogger;
use App\Observability\ContractJsonFormatter;
use App\Observability\HttpLogSubscriber;
use App\Observability\RequestIdSubscriber;
use Monolog\Handler\TestHandler;
use Monolog\Level;
use Monolog\Logger;
use Monolog\LogRecord;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\Event\TerminateEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

/**
 * Contrat de logs de l'observabilité du VPS : format, redaction, request_id, ligne http, appels
 * (climalia).
 */
final class ObservabilityTest extends TestCase
{
    private const UUID_V7 = '/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/';

    private function format(string $channel, Level $level, string $message, array $context = [], array $extra = []): array
    {
        $formatter = new ContractJsonFormatter('climalia', 'app', 'prod');
        $line = $formatter->format(new LogRecord(new \DateTimeImmutable('2026-10-04T18:00:00.123+02:00'), $channel, $level, $message, $context, $extra));
        self::assertStringEndsWith("\n", $line);
        self::assertSame(1, substr_count($line, "\n"), 'une seule ligne');

        return json_decode($line, true, flags: \JSON_THROW_ON_ERROR);
    }

    public function testLigneHttpAuContrat(): void
    {
        $l = $this->format('http', Level::Info, 'GET /api/sessions/{token} 200', ['request_id' => 'r-1', 'http' => ['method' => 'GET', 'route' => '/api/sessions/{token}', 'status' => 200, 'duration_ms' => 12]], ['user_id' => 'u-1']);
        self::assertSame(['ts', 'level', 'app', 'service', 'env', 'type', 'msg', 'request_id', 'user_id', 'http'], array_keys($l));
        self::assertSame('2026-10-04T16:00:00.123Z', $l['ts']);
        self::assertSame(['info', 'climalia', 'app', 'prod', 'http'], [$l['level'], $l['app'], $l['service'], $l['env'], $l['type']]);
        self::assertSame('/api/sessions/{token}', $l['http']['route']);
    }

    public function testAuditEtNiveaux(): void
    {
        $l = $this->format('audit', Level::Info, 'team.joined', ['event' => 'team.joined', 'props' => ['team_id' => 't1']]);
        self::assertSame(['audit', 'team.joined', ['team_id' => 't1']], [$l['type'], $l['event'], $l['props']]);
        self::assertSame('warn', $this->format('app', Level::Warning, 'w')['level']);
        self::assertSame('error', $this->format('request', Level::Critical, 'c')['level']);
        self::assertSame('info', $this->format('app', Level::Notice, 'n')['level']);
    }

    public function testExceptionSurUneLigneDansErr(): void
    {
        $l = $this->format('request', Level::Critical, 'Uncaught', ['exception' => new \RuntimeException("boum\nligne 2", 0, new \LogicException('cause'))]);
        self::assertSame('app', $l['type']);
        self::assertSame(\RuntimeException::class, $l['err']['type']);
        self::assertStringContainsString('Caused by LogicException: cause', $l['err']['stack']);
        self::assertSame('request', $l['props']['channel']);
    }

    public function testRedactionDesDonneesSensibles(): void
    {
        $l = $this->format('app', Level::Error, 'x', ['email' => 'jean@example.com', 'props' => ['password' => 'p', 'nested' => ['access_token' => 't', 'address' => '23 rue X'], 'session_ref' => 'abc']]);
        $json = json_encode($l);
        foreach (['jean@example.com', '"p"', '"t"', '23 rue X'] as $secret) {
            self::assertStringNotContainsString($secret, $json);
        }
        self::assertSame('abc', $l['props']['session_ref']);
    }

    public function testRequestIdReprisOuGenereEtRenvoye(): void
    {
        $sub = new RequestIdSubscriber();
        $kernel = $this->createStub(HttpKernelInterface::class);

        $request = Request::create('/');
        $request->headers->set('X-Request-Id', '0192F4A1-7B2C-7D3E-8F40-123456789ABC');
        $sub->onRequest(new RequestEvent($kernel, $request, HttpKernelInterface::MAIN_REQUEST));
        self::assertSame('0192f4a1-7b2c-7d3e-8f40-123456789abc', $request->attributes->get(RequestIdSubscriber::ATTRIBUTE));

        foreach (['', 'pas-un-uuid', str_repeat('x', 500)] as $bad) {
            $request = Request::create('/');
            $request->headers->set('X-Request-Id', $bad);
            $sub->onRequest(new RequestEvent($kernel, $request, HttpKernelInterface::MAIN_REQUEST));
            self::assertMatchesRegularExpression(self::UUID_V7, (string) $request->attributes->get(RequestIdSubscriber::ATTRIBUTE));
        }

        $response = new Response();
        $sub->onResponse(new ResponseEvent($kernel, $request, HttpKernelInterface::MAIN_REQUEST, $response));
        self::assertSame($request->attributes->get(RequestIdSubscriber::ATTRIBUTE), $response->headers->get('X-Request-Id'));
    }

    public function testLigneHttpRouteEnTemplateEtExclusions(): void
    {
        $handler = new TestHandler();
        $sub = new HttpLogSubscriber(new Logger('http', [$handler]));
        $kernel = $this->createStub(HttpKernelInterface::class);

        $request = Request::create('/api/documents/0192f4a1-7b2c-7d3e-8f40-123456789abc', 'POST');
        $request->attributes->set(RequestIdSubscriber::ATTRIBUTE, 'rid-1');
        $request->attributes->set('_route', 'api_documents_update');
        $request->attributes->set('_route_params', ['id' => '0192f4a1-7b2c-7d3e-8f40-123456789abc']);
        $sub->onTerminate(new TerminateEvent($kernel, $request, new Response('', 201)));
        $record = $handler->getRecords()[0];
        self::assertSame('POST /api/documents/{id} 201', $record->message);
        self::assertSame('rid-1', $record->context['request_id'], 'request_id posé hors RequestStack');
        self::assertSame(['method' => 'POST', 'route' => '/api/documents/{id}', 'status' => 201], array_diff_key($record->context['http'], ['duration_ms' => 1]));
        self::assertStringNotContainsString('0192f4a1-7b2c-7d3e-8f40-123456789abc', json_encode($record->context));

        $unmatched = Request::create('/wp-login.php');
        $sub->onTerminate(new TerminateEvent($kernel, $unmatched, new Response('', 404)));
        self::assertSame('unmatched', $handler->getRecords()[1]->context['http']['route']);

        $profiler = Request::create('/_wdt/abc');
        $profiler->attributes->set('_route', '_wdt');
        $sub->onTerminate(new TerminateEvent($kernel, $profiler, new Response()));
        self::assertCount(2, $handler->getRecords());

        $boom = Request::create('/api/x');
        $boom->attributes->set('_route', 'x');
        $sub->onTerminate(new TerminateEvent($kernel, $boom, new Response('', 503)));
        self::assertSame(Level::Error, $handler->getRecords()[2]->level);
    }
}
