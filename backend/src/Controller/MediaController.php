<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapUploadedFile;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Upload d'images éditoriales (réalisations, contenu des pages).
 *
 * Stockées sous public/uploads et servies en statique par Caddy sur /uploads/*.
 * Accès restreint à ROLE_EDITOR (cf. security.yaml access_control ^/api/media).
 */
#[Route('/api/media', name: 'api_media_')]
final class MediaController extends AbstractController
{
    public function __construct(
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
    }

    #[Route('', name: 'upload', methods: ['POST'])]
    public function upload(
        #[MapUploadedFile([
            new Assert\NotNull(message: 'Aucun fichier reçu (champ « file »).'),
            new Assert\Image(
                maxSize: '5M',
                mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
                mimeTypesMessage: 'Formats acceptés : JPEG, PNG, WebP, AVIF.',
            ),
        ])]
        UploadedFile $file,
    ): JsonResponse {
        $uploadDir = $this->projectDir . '/public/uploads';
        $name = Uuid::v7()->toRfc4122() . '.' . ($file->guessExtension() ?? 'bin');
        $file->move($uploadDir, $name);

        $url = '/uploads/' . $name;

        return new JsonResponse([
            'url' => $url,
            'name' => $name,
        ], Response::HTTP_CREATED);
    }
}
