<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260707210504 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Devis : horodatage de réponse admin (replied_at). Documents : date métier (document_date) pour le calendrier admin.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE contact_requests ADD replied_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE documents ADD document_date DATE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE contact_requests DROP replied_at');
        $this->addSql('ALTER TABLE documents DROP document_date');
    }
}
