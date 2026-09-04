<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\SiteContent;
use App\Repository\SiteContentRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Clés de contenu éditables du site vitrine.
 *
 * GET est public (le front applique les overrides par-dessus ses textes par
 * défaut) ; PUT est réservé à l'éditorial (ROLE_EDITOR, hérité par ROLE_ADMIN
 * — cf. security.yaml). Une valeur vide ou nulle supprime l'override.
 */
#[Route('/api/content', name: 'api_content_')]
final class ContentController extends AbstractController
{
    public function __construct(
        private readonly SiteContentRepository $contents,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('', name: 'overrides', methods: ['GET'])]
    public function overrides(): JsonResponse
    {
        return new JsonResponse($this->overridesMap());
    }

    #[Route('', name: 'save', methods: ['PUT'])]
    public function save(Request $request): JsonResponse
    {
        $decoded = json_decode($request->getContent(), true);
        $entries = is_array($decoded) && isset($decoded['entries']) && is_array($decoded['entries'])
            ? $decoded['entries']
            : null;
        if ($entries === null) {
            return new JsonResponse(
                ['message' => 'Payload invalide : { "entries": [{ "key", "value" }] } attendu.'],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        foreach ($entries as $entry) {
            if (!is_array($entry) || !isset($entry['key']) || !is_string($entry['key'])) {
                continue;
            }
            $key = trim($entry['key']);
            if ($key === '' || mb_strlen($key) > 191) {
                continue;
            }

            $value = $entry['value'] ?? null;
            $existing = $this->contents->findByKey($key);

            if (!is_string($value) || trim($value) === '') {
                // Valeur vide → retour au texte par défaut du front.
                if ($existing instanceof SiteContent) {
                    $this->em->remove($existing);
                }
                continue;
            }

            if ($existing instanceof SiteContent) {
                $existing->setValue($value);
            } else {
                $this->em->persist(new SiteContent($key, $value));
            }
        }
        $this->em->flush();

        return new JsonResponse($this->overridesMap());
    }

    /**
     * @return array<string, string>
     */
    private function overridesMap(): array
    {
        $map = [];
        foreach ($this->contents->findAll() as $entry) {
            $map[$entry->getKey()] = $entry->getValue();
        }
        ksort($map);

        return $map;
    }
}
