<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\User;
use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\NullOutput;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\HttpKernel\KernelInterface;

abstract class ApiTestCase extends WebTestCase
{
    protected KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        self::resetDatabase($this->client->getKernel());
    }

    protected static function resetDatabase(KernelInterface $kernel): void
    {
        $application = new Application($kernel);
        $application->setAutoExit(false);

        $output = new NullOutput();
        self::runCommand($application, $output, [
            'command' => 'doctrine:database:create',
            '--if-not-exists' => true,
        ]);
        self::runCommand($application, $output, [
            'command' => 'doctrine:schema:drop',
            '--full-database' => true,
            '--force' => true,
        ]);
        self::runCommand($application, $output, [
            'command' => 'doctrine:schema:create',
        ]);
        self::runCommand($application, $output, [
            'command' => 'doctrine:fixtures:load',
            '--no-interaction' => true,
        ]);
    }

    /**
     * @param array<string,mixed> $args
     */
    private static function runCommand(Application $app, OutputInterface $output, array $args): void
    {
        $code = $app->run(new ArrayInput($args), $output);
        if ($code !== 0) {
            throw new \RuntimeException(sprintf('Command "%s" failed with code %d', (string) $args['command'], $code));
        }
    }

    protected function authenticateAs(string $email): User
    {
        $repo = self::getContainer()->get(UserRepository::class);
        \assert($repo instanceof UserRepository);
        $user = $repo->findByEmail($email);
        if (!$user instanceof User) {
            throw new \RuntimeException(sprintf('User %s not found in fixtures.', $email));
        }

        $jwt = self::getContainer()->get(JWTTokenManagerInterface::class);
        \assert($jwt instanceof JWTTokenManagerInterface);
        $token = $jwt->create($user);

        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $token);

        return $user;
    }

    /**
     * @return array<string,mixed>
     */
    protected function decodeJson(): array
    {
        $content = (string) $this->client->getResponse()->getContent();
        /** @var array<string,mixed> $data */
        $data = json_decode($content, associative: true, flags: JSON_THROW_ON_ERROR);

        return $data;
    }
}
