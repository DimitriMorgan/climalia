<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260705145343 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Table site_content : overrides des clés de contenu du site vitrine (CMS léger).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE site_content (id UUID NOT NULL, content_key VARCHAR(191) NOT NULL, value TEXT NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_site_content_key ON site_content (content_key)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE site_content');
    }
}
