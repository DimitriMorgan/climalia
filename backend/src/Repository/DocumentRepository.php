<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Document;
use App\Enum\DocumentCategory;
use DateTimeImmutable;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Document>
 */
class DocumentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Document::class);
    }

    /**
     * Filtres simples (catégorie / dates / région). La visibilité par rôle
     * est appliquée par DocumentVoter en sortie de cette méthode.
     *
     * @return list<Document>
     */
    public function findFiltered(
        ?DocumentCategory $category = null,
        ?DateTimeImmutable $dateFrom = null,
        ?DateTimeImmutable $dateTo = null,
        ?string $region = null,
    ): array {
        $qb = $this->createQueryBuilder('d')->orderBy('d.uploadedAt', 'DESC');

        if ($category !== null) {
            $qb->andWhere('d.category = :category')->setParameter('category', $category->value);
        }

        if ($dateFrom !== null) {
            $qb->andWhere('d.uploadedAt >= :dateFrom')->setParameter('dateFrom', $dateFrom);
        }

        if ($dateTo !== null) {
            $qb->andWhere('d.uploadedAt <= :dateTo')->setParameter('dateTo', $dateTo);
        }

        if ($region !== null && $region !== '') {
            $qb->andWhere('d.region = :region')->setParameter('region', $region);
        }

        /** @var list<Document> $result */
        $result = $qb->getQuery()->getResult();

        return $result;
    }
}
