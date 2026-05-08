<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Realization;
use App\Enum\EquipmentType;
use App\Enum\RealizationType;
use App\Repository\RealizationRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/realizations', name: 'api_realizations_')]
final class RealizationController extends AbstractController
{
    public function __construct(
        private readonly RealizationRepository $realizations,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $type = $this->parseEnum(RealizationType::class, $request->query->get('type'));
        $equipmentType = $this->parseEnum(EquipmentType::class, $request->query->get('equipmentType'));
        $region = $this->normalizeNullable($request->query->get('region'));

        $realizations = $this->realizations->findFiltered($type, $equipmentType, $region);

        $payload = array_map(static fn (Realization $r): array => [
            'id' => $r->getId()->toRfc4122(),
            'title' => $r->getTitle(),
            'description' => $r->getDescription(),
            'type' => $r->getType()->value,
            'equipmentType' => $r->getEquipmentType()->value,
            'region' => $r->getRegion(),
            'beforeImageUrl' => $r->getBeforeImageUrl(),
            'afterImageUrl' => $r->getAfterImageUrl(),
            'publishedAt' => $r->getPublishedAt()->format(DATE_ATOM),
        ], $realizations);

        return new JsonResponse($payload);
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
