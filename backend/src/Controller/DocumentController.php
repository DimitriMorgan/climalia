<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Document;
use App\Entity\User;
use App\Enum\DocumentCategory;
use App\Repository\DocumentRepository;
use App\Security\DocumentVoter;
use DateTimeImmutable;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Uid\Uuid;

#[Route('/api/documents', name: 'api_documents_')]
final class DocumentController extends AbstractController
{
    public function __construct(
        private readonly DocumentRepository $documents,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $category = $this->parseCategory($request->query->get('category'));
        $dateFrom = $this->parseDate($request->query->get('dateFrom'));
        $dateTo = $this->parseDate($request->query->get('dateTo'));
        $region = $this->normalizeNullable($request->query->get('region'));

        $all = $this->documents->findFiltered($category, $dateFrom, $dateTo, $region);

        $visible = array_values(array_filter(
            $all,
            fn (Document $d): bool => $this->isGranted(DocumentVoter::VIEW, $d),
        ));

        $payload = array_map(static fn (Document $d): array => [
            'id' => $d->getId()->toRfc4122(),
            'title' => $d->getTitle(),
            'category' => $d->getCategory()->value,
            'mimeType' => $d->getMimeType(),
            'sizeBytes' => $d->getSizeBytes(),
            'region' => $d->getRegion(),
            'uploadedAt' => $d->getUploadedAt()->format(DATE_ATOM),
        ], $visible);

        return new JsonResponse($payload);
    }

    #[Route('/{id}/download', name: 'download', methods: ['GET'])]
    public function download(string $id): Response
    {
        if (!Uuid::isValid($id)) {
            throw new NotFoundHttpException('Invalid document id.');
        }

        $document = $this->documents->find(Uuid::fromString($id));
        if (!$document instanceof Document) {
            throw new NotFoundHttpException('Document not found.');
        }

        if (!$this->isGranted(DocumentVoter::VIEW, $document)) {
            throw new AccessDeniedHttpException('You cannot access this document.');
        }

        // Phase 1 : pas de stockage de fichiers réels, on renvoie l'URL en JSON.
        // (Le streaming binaire sera branché en phase 2 sur un object storage.)
        return new JsonResponse([
            'id' => $document->getId()->toRfc4122(),
            'title' => $document->getTitle(),
            'fileUrl' => $document->getFileUrl(),
            'mimeType' => $document->getMimeType(),
            'sizeBytes' => $document->getSizeBytes(),
        ]);
    }

    private function parseCategory(mixed $value): ?DocumentCategory
    {
        if ($value === null || $value === '') {
            return null;
        }

        return is_string($value) ? DocumentCategory::tryFrom($value) : null;
    }

    private function parseDate(mixed $value): ?DateTimeImmutable
    {
        if (!is_string($value) || $value === '') {
            return null;
        }

        try {
            return new DateTimeImmutable($value);
        } catch (\Exception) {
            return null;
        }
    }

    private function normalizeNullable(mixed $value): ?string
    {
        if (!is_string($value) || $value === '') {
            return null;
        }

        return $value;
    }
}
