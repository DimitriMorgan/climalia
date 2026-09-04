<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260630224356 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Phase 2: Client (entreprise) entity + user.client_id, document audience + storage_path (file_url nullable), dispatch par entreprise. Corrige la visibilité des livrables existants.';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE clients (id UUID NOT NULL, name VARCHAR(180) NOT NULL, segment VARCHAR(32) NOT NULL, region VARCHAR(100) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE TABLE document_assigned_clients (document_id UUID NOT NULL, client_id UUID NOT NULL, PRIMARY KEY (document_id, client_id))');
        $this->addSql('CREATE INDEX IDX_6B32A529C33F7837 ON document_assigned_clients (document_id)');
        $this->addSql('CREATE INDEX IDX_6B32A52919EB6921 ON document_assigned_clients (client_id)');
        $this->addSql('ALTER TABLE document_assigned_clients ADD CONSTRAINT FK_6B32A529C33F7837 FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE document_assigned_clients ADD CONSTRAINT FK_6B32A52919EB6921 FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE');
        // audience : ajout sûr sur une table non vide (prod) — nullable, backfill, puis NOT NULL.
        $this->addSql('ALTER TABLE documents ADD audience VARCHAR(16) DEFAULT NULL');
        $this->addSql("UPDATE documents SET audience = 'CLIENT' WHERE category IN ('INVOICE', 'MAINTENANCE_CERTIFICATE', 'INTERVENTION_REPORT', 'MAINTENANCE_CONTRACT')");
        $this->addSql("UPDATE documents SET audience = 'INTERNAL' WHERE audience IS NULL");
        // Corrige la fuite inter-locataires sur les données existantes : un livrable
        // client n'est plus diffusé par rôle (il sera dispatché par entreprise).
        $this->addSql("UPDATE documents SET visible_to_roles = '[]' WHERE audience = 'CLIENT'");
        $this->addSql('ALTER TABLE documents ALTER audience SET NOT NULL');
        $this->addSql('ALTER TABLE documents ADD storage_path VARCHAR(1024) DEFAULT NULL');
        $this->addSql('ALTER TABLE documents ALTER file_url DROP NOT NULL');
        $this->addSql('ALTER TABLE users ADD client_id UUID DEFAULT NULL');
        $this->addSql('ALTER TABLE users ADD CONSTRAINT FK_1483A5E919EB6921 FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('CREATE INDEX IDX_1483A5E919EB6921 ON users (client_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE document_assigned_clients DROP CONSTRAINT FK_6B32A529C33F7837');
        $this->addSql('ALTER TABLE document_assigned_clients DROP CONSTRAINT FK_6B32A52919EB6921');
        $this->addSql('DROP TABLE clients');
        $this->addSql('DROP TABLE document_assigned_clients');
        $this->addSql('ALTER TABLE documents DROP audience');
        $this->addSql('ALTER TABLE documents DROP storage_path');
        $this->addSql('ALTER TABLE documents ALTER file_url SET NOT NULL');
        $this->addSql('ALTER TABLE users DROP CONSTRAINT FK_1483A5E919EB6921');
        $this->addSql('DROP INDEX IDX_1483A5E919EB6921');
        $this->addSql('ALTER TABLE users DROP client_id');
    }
}
