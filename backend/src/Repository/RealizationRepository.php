<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Realization;
use App\Enum\EquipmentType;
use App\Enum\RealizationType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Realization>
 */
class RealizationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Realization::class);
    }

    /**
     * @return list<Realization>
     */
    public function findFiltered(
        ?RealizationType $type = null,
        ?EquipmentType $equipmentType = null,
        ?string $region = null,
    ): array {
        $qb = $this->createQueryBuilder('r')->orderBy('r.publishedAt', 'DESC');

        if ($type !== null) {
            $qb->andWhere('r.type = :type')->setParameter('type', $type->value);
        }

        if ($equipmentType !== null) {
            $qb->andWhere('r.equipmentType = :equipmentType')->setParameter('equipmentType', $equipmentType->value);
        }

        if ($region !== null && $region !== '') {
            $qb->andWhere('r.region = :region')->setParameter('region', $region);
        }

        /** @var list<Realization> $result */
        $result = $qb->getQuery()->getResult();

        return $result;
    }
}
