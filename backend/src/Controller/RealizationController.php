<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\RealizationInput;
use App\Entity\Realization;
use App\Enum\EquipmentType;
use App\Enum\RealizationType;
use App\Repository\RealizationRepository;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/realizations', name: 'api_realizations_')]
final class RealizationController extends AbstractController
{
    public function __construct(
        private readonly RealizationRepository $realizations,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $type = $this->parseEnum(RealizationType::class, $request->query->get('type'));
        $equipmentType = $this->parseEnum(EquipmentType::class, $request->query->get('equipmentType'));
        $region = $this->normalizeNullable($request->query->get('region'));

        $realizations = $this->realizations->findFiltered($type, $equipmentType, $region);

        return new JsonResponse(array_map($this->serialize(...), $realizations));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(#[MapRequestPayload] RealizationInput $input): JsonResponse
    {
        $realization = new Realization(
            title: $input->title,
            description: $input->description,
            type: $input->type,
            equipmentType: $input->equipmentType,
            region: $input->region,
            beforeImageUrl: $input->beforeImageUrl,
            afterImageUrl: $input->afterImageUrl,
            publishedAt: $this->parsePublishedAt($input->publishedAt),
        );

        $this->em->persist($realization);
        $this->em->flush();

        return new JsonResponse($this->serialize($realization), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(string $id, #[MapRequestPayload] RealizationInput $input): JsonResponse
    {
        $realization = $this->findOr404($id);

        $realization->setTitle($input->title);
        $realization->setDescription($input->description);
        $realization->setType($input->type);
        $realization->setEquipmentType($input->equipmentType);
        $realization->setRegion($input->region);
        $realization->setBeforeImageUrl($input->beforeImageUrl);
        $realization->setAfterImageUrl($input->afterImageUrl);

        $publishedAt = $this->parsePublishedAt($input->publishedAt);
        if ($publishedAt !== null) {
            $realization->setPublishedAt($publishedAt);
        }

        $this->em->flush();

        return new JsonResponse($this->serialize($realization));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(string $id): JsonResponse
    {
        $realization = $this->findOr404($id);

        $this->em->remove($realization);
        $this->em->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Realization $r): array
    {
        return [
            'id' => $r->getId()->toRfc4122(),
            'title' => $r->getTitle(),
            'description' => $r->getDescription(),
            'type' => $r->getType()->value,
            'equipmentType' => $r->getEquipmentType()->value,
            'region' => $r->getRegion(),
            'beforeImageUrl' => $r->getBeforeImageUrl(),
            'afterImageUrl' => $r->getAfterImageUrl(),
            'publishedAt' => $r->getPublishedAt()->format(DATE_ATOM),
        ];
    }

    private function findOr404(string $id): Realization
    {
        if (!Uuid::isValid($id)) {
            throw new NotFoundHttpException('Invalid realization id.');
        }

        $realization = $this->realizations->find(Uuid::fromString($id));
        if (!$realization instanceof Realization) {
            throw new NotFoundHttpException('Realization not found.');
        }

        return $realization;
    }

    private function parsePublishedAt(?string $value): ?DateTimeImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }

        try {
            return new DateTimeImmutable($value);
        } catch (\Exception) {
            return null;
        }
    }

    /**
     * @template T of \BackedEnum
     * @param class-string<T> $enumClass
     * @return T|null
     */
    private function parseEnum(string $enumClass, mixed $value): ?\BackedEnum
    {
        if (!is_string($value) || $value === '') {
            return null;
        }

        /** @var T|null $instance */
        $instance = $enumClass::tryFrom($value);

        return $instance;
    }

    private function normalizeNullable(mixed $value): ?string
    {
        if (!is_string($value) || $value === '') {
            return null;
        }

        return $value;
    }
}
