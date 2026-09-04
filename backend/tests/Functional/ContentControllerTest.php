<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpFoundation\Response;

final class ContentControllerTest extends ApiTestCase
{
    #[Test]
    public function get_overrides_est_public_et_vide_par_defaut(): void
    {
        $this->client->request('GET', '/api/content');

        self::assertResponseIsSuccessful();
        self::assertSame([], $this->decodeJson());
    }

    #[Test]
    public function editor_peut_creer_et_mettre_a_jour_des_overrides(): void
    {
        $this->authenticateAs('editor@climalia.fr');

        $this->client->request(
            'PUT',
            '/api/content',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['entries' => [
                ['key' => 'home.hero.title', 'value' => 'Nouveau titre'],
                ['key' => 'home.cta.eyebrow', 'value' => 'Envie de démarrer ?'],
            ]]),
        );
        self::assertResponseIsSuccessful();
        $map = $this->decodeJson();
        self::assertSame('Nouveau titre', $map['home.hero.title']);

        // Mise à jour d'une clé existante.
        $this->client->request(
            'PUT',
            '/api/content',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['entries' => [
                ['key' => 'home.hero.title', 'value' => 'Titre corrigé'],
            ]]),
        );
        $map = $this->decodeJson();
        self::assertSame('Titre corrigé', $map['home.hero.title']);
        self::assertSame('Envie de démarrer ?', $map['home.cta.eyebrow']);
    }

    #[Test]
    public function valeur_vide_supprime_l_override(): void
    {
        $this->authenticateAs('editor@climalia.fr');

        $this->client->request(
            'PUT',
            '/api/content',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['entries' => [['key' => 'footer.tagline', 'value' => 'Override']]]),
        );
        self::assertArrayHasKey('footer.tagline', $this->decodeJson());

        $this->client->request(
            'PUT',
            '/api/content',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['entries' => [['key' => 'footer.tagline', 'value' => '']]]),
        );
        self::assertArrayNotHasKey('footer.tagline', $this->decodeJson());
    }

    #[Test]
    public function admin_herite_du_droit_editorial(): void
    {
        $this->authenticateAs('admin@climalia.fr');

        $this->client->request(
            'PUT',
            '/api/content',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['entries' => [['key' => 'a.b', 'value' => 'c']]]),
        );
        self::assertResponseIsSuccessful();
    }

    #[Test]
    public function employee_ne_peut_pas_ecrire(): void
    {
        $this->authenticateAs('employe.idf@climalia.fr');

        $this->client->request(
            'PUT',
            '/api/content',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['entries' => [['key' => 'a.b', 'value' => 'c']]]),
        );
        self::assertResponseStatusCodeSame(Response::HTTP_FORBIDDEN);
    }

    #[Test]
    public function payload_invalide_renvoie_422(): void
    {
        $this->authenticateAs('editor@climalia.fr');

        $this->client->request(
            'PUT',
            '/api/content',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: (string) json_encode(['nope' => true]),
        );
        self::assertResponseStatusCodeSame(Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
