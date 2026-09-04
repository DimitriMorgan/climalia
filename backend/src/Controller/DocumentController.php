<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Client;
use App\Entity\Document;
use App\Entity\User;
use App\Enum\DocumentAudience;
use App\Enum\DocumentCategory;
use App\Enum\UserRole;
use App\Repository\ClientRepository;
use App\Repository\DocumentRepository;
use App\Security\DocumentVoter;
use App\Service\DocumentNotificationMailer;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpKernel\Attribute\MapUploadedFile;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\String\Slugger\AsciiSlugger;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[Route('/api/documents', name: 'api_documents_')]
final class DocumentController extends AbstractController
{
    public function __construct(
        private readonly DocumentRepository $documents,
        private readonly ClientRepository $clients,
        private readonly EntityManagerInterface $em,
        private readonly DocumentNotificationMailer $notifier,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
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

        // Filtre « pool » (non affecté) — utile à la vue dispatch admin.
        $unassigned = $request->query->get('unassigned');
        if ($unassigned === '1' || $unassigned === 'true') {
            $visible = array_values(array_filter(
                $visible,
                static fn (Document $d): bool => $d->getAssignedClients()->isEmpty(),
            ));
        }

        $payload = array_map(fn (Document $d): array => $this->serialize($d, $user), $visible);

        return new JsonResponse($payload);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request $request,
        #[CurrentUser] User $user,
        #[MapUploadedFile([
            new Assert\NotNull(message: 'Aucun fichier reçu (champ « file »).'),
            new Assert\File(maxSize: '20M'),
        ])]
        UploadedFile $file,
    ): JsonResponse {
        $title = trim((string) $request->request->get('title', ''));
        $category = DocumentCategory::tryFrom((string) $request->request->get('category', ''));
        $region = $this->normalizeNullable($request->request->get('region'));

        $violations = [];
        if ($title === '') {
            $violations[] = ['propertyPath' => 'title', 'message' => 'Titre requis.'];
        }
        if ($category === null) {
            $violations[] = ['propertyPath' => 'category', 'message' => 'Catégorie invalide ou manquante.'];
        }
        if ($violations !== []) {
            return new JsonResponse(
                ['message' => 'Validation échouée.', 'violations' => $violations],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }
        \assert($category instanceof DocumentCategory);

        // Métadonnées AVANT déplacement (l'objet UploadedFile change de chemin après move()).
        $sizeBytes = $file->getSize() ?? 0;
        $mimeType = $file->getClientMimeType();
        $extension = $file->guessExtension() ?? 'bin';

        $audience = DocumentAudience::tryFrom((string) $request->request->get('audience', ''))
            ?? DocumentAudience::INTERNAL;
        // INTERNAL = visible aux employés ; CLIENT = livrable affecté à des entreprises.
        $visibleToRoles = $audience === DocumentAudience::INTERNAL ? [UserRole::EMPLOYEE] : [];

        $storageDir = $this->projectDir . '/var/documents';
        $storageName = Uuid::v7()->toRfc4122() . '.' . $extension;
        $file->move($storageDir, $storageName);

        $document = new Document(
            title: $title,
            category: $category,
            fileUrl: null,
            mimeType: $mimeType,
            sizeBytes: $sizeBytes,
            ownerUser: $user,
            visibleToRoles: $visibleToRoles,
            region: $region,
            audience: $audience,
        );
        $document->setStoragePath($storageName);
        // Date métier optionnelle (échéance, intervention…) — alimente le calendrier admin.
        $document->setDocumentDate($this->parseDate($request->request->get('documentDate')));

        // Pré-affectation optionnelle à des entreprises clientes (livrables uniquement).
        $assignedCompanies = [];
        if ($audience === DocumentAudience::CLIENT) {
            $assignedCompanies = $this->resolveClientCompanies($request->request->all('assignedClientIds'));
            foreach ($assignedCompanies as $company) {
                $document->addAssignedClient($company);
            }
        }

        $this->em->persist($document);
        $this->em->flush();

        // Notification e-mail optionnelle des contacts des entreprises affectées.
        $notify = in_array($request->request->get('notify'), ['1', 'true'], true);
        if ($notify && $assignedCompanies !== []) {
            $this->notifier->notifyNewDocument($document, $assignedCompanies);
        }

        return new JsonResponse($this->serialize($document, $user), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    public function get(string $id, #[CurrentUser] User $user): JsonResponse
    {
        $document = $this->findOr404($id);

        if (!$this->isGranted(DocumentVoter::VIEW, $document)) {
            throw new AccessDeniedHttpException('You cannot access this document.');
        }

        return new JsonResponse($this->serialize($document, $user));
    }

    #[Route('/{id}/download', name: 'download', methods: ['GET'])]
    public function download(string $id, #[CurrentUser] User $user): Response
    {
        $document = $this->findOr404($id);

        if (!$this->isGranted(DocumentVoter::VIEW, $document)) {
            throw new AccessDeniedHttpException('You cannot access this document.');
        }

        $storagePath = $document->getStoragePath();
        if ($storagePath !== null) {
            $absolute = $this->projectDir . '/var/documents/' . basename($storagePath);
            if (!is_file($absolute)) {
                throw new NotFoundHttpException('Stored file is missing.');
            }

            $response = new BinaryFileResponse($absolute);
            $response->headers->set('Content-Type', $document->getMimeType());
            $response->headers->set('X-Content-Type-Options', 'nosniff');
            $response->setContentDisposition(
                ResponseHeaderBag::DISPOSITION_ATTACHMENT,
                $this->downloadFilename($document, $storagePath),
            );

            return $response;
        }

        // Document hérité/externe sans fichier stocké : on renvoie l'URL (compat phase 1).
        return new JsonResponse([
            'id' => $document->getId()->toRfc4122(),
            'title' => $document->getTitle(),
            'fileUrl' => $document->getFileUrl(),
            'mimeType' => $document->getMimeType(),
            'sizeBytes' => $document->getSizeBytes(),
        ]);
    }

    /**
     * Mise à jour admin des métadonnées « calendrier » d'un document.
     * `documentDate` : date ISO pour poser/déplacer le document, null pour la retirer.
     */
    #[Route('/{id}', name: 'update', methods: ['PATCH'], requirements: ['id' => '[0-9a-fA-F-]{36}'])]
    public function update(string $id, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        // Réservé à l'admin administratif (cf. security.yaml).
        $document = $this->findOr404($id);

        $decoded = json_decode($request->getContent(), true);
        if (!is_array($decoded) || !array_key_exists('documentDate', $decoded)) {
            return new JsonResponse(
                ['message' => 'Validation échouée.', 'violations' => [['propertyPath' => 'documentDate', 'message' => 'Champ documentDate requis (date ISO ou null).']]],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $raw = $decoded['documentDate'];
        if ($raw === null) {
            $document->setDocumentDate(null);
        } else {
            $date = is_string($raw) ? $this->parseDate($raw) : null;
            if ($date === null) {
                return new JsonResponse(
                    ['message' => 'Validation échouée.', 'violations' => [['propertyPath' => 'documentDate', 'message' => 'Date invalide (format attendu : YYYY-MM-DD).']]],
                    Response::HTTP_UNPROCESSABLE_ENTITY,
                );
            }
            $document->setDocumentDate($date);
        }

        $this->em->flush();

        return new JsonResponse($this->serialize($document, $user));
    }

    #[Route('/{id}/clients', name: 'assign_clients', methods: ['PUT'])]
    public function assignClients(string $id, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        // Réservé à l'admin administratif (cf. security.yaml). Remplace l'affectation.
        $document = $this->findOr404($id);

        $decoded = json_decode($request->getContent(), true);
        $rawIds = is_array($decoded) && isset($decoded['clientIds']) && is_array($decoded['clientIds'])
            ? $decoded['clientIds']
            : [];
        $notify = is_array($decoded) && ($decoded['notify'] ?? false) === true;

        $previousIds = array_map(
            static fn (Client $c): string => $c->getId()->toRfc4122(),
            $document->getAssignedClients()->toArray(),
        );

        $document->clearAssignedClients();
        $companies = $this->resolveClientCompanies($rawIds);
        foreach ($companies as $company) {
            $document->addAssignedClient($company);
        }
        $document->setAudience(DocumentAudience::CLIENT);
        $this->em->flush();

        // On ne notifie que les entreprises NOUVELLEMENT affectées (pas de spam
        // des clients déjà notifiés lors d'un réajustement du dispatch).
        if ($notify) {
            $newlyAssigned = array_values(array_filter(
                $companies,
                static fn (Client $c): bool => !in_array($c->getId()->toRfc4122(), $previousIds, true),
            ));
            if ($newlyAssigned !== []) {
                $this->notifier->notifyNewDocument($document, $newlyAssigned);
            }
        }

        return new JsonResponse($this->serialize($document, $user));
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Document $d, User $viewer): array
    {
        $payload = [
            'id' => $d->getId()->toRfc4122(),
            'title' => $d->getTitle(),
            'category' => $d->getCategory()->value,
            'audience' => $d->getAudience()->value,
            'mimeType' => $d->getMimeType(),
            'sizeBytes' => $d->getSizeBytes(),
            'region' => $d->getRegion(),
            'uploadedAt' => $d->getUploadedAt()->format(DATE_ATOM),
            'documentDate' => $d->getDocumentDate()?->format('Y-m-d'),
            'hasFile' => $d->getStoragePath() !== null,
        ];

        // Vue admin (dispatch) : qui a uploadé + entreprises affectées. Non exposé aux autres rôles.
        if ($viewer->getRoleEnum() === UserRole::ADMIN) {
            $owner = $d->getOwnerUser();
            $payload['uploadedBy'] = $owner !== null
                ? trim($owner->getFirstName() . ' ' . $owner->getLastName())
                : null;
            $payload['assignedClients'] = array_map(
                static fn (Client $c): array => ['id' => $c->getId()->toRfc4122(), 'label' => $c->getName()],
                $d->getAssignedClients()->toArray(),
            );
        }

        return $payload;
    }

    private function downloadFilename(Document $document, string $storagePath): string
    {
        $extension = pathinfo($storagePath, PATHINFO_EXTENSION);
        $slug = (new AsciiSlugger())->slug($document->getTitle())->lower()->toString();
        if ($slug === '') {
            $slug = 'document';
        }

        return $extension !== '' ? $slug . '.' . $extension : $slug;
    }

    /**
     * Résout une liste d'IDs en entreprises clientes (ignore les IDs invalides).
     *
     * @param array<int|string, mixed> $ids
     * @return list<Client>
     */
    private function resolveClientCompanies(array $ids): array
    {
        $companies = [];
        foreach ($ids as $id) {
            if (!is_string($id) || !Uuid::isValid($id)) {
                continue;
            }
            $company = $this->clients->find(Uuid::fromString($id));
            if ($company instanceof Client) {
                $companies[] = $company;
            }
        }

        return $companies;
    }

    private function findOr404(string $id): Document
    {
        if (!Uuid::isValid($id)) {
            throw new NotFoundHttpException('Invalid document id.');
        }

        $document = $this->documents->find(Uuid::fromString($id));
        if (!$document instanceof Document) {
            throw new NotFoundHttpException('Document not found.');
        }

        return $document;
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
