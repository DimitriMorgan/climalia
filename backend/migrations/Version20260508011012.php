<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260508011012 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE contact_requests (id UUID NOT NULL, full_name VARCHAR(200) NOT NULL, email VARCHAR(180) NOT NULL, phone VARCHAR(30) NOT NULL, postal_code VARCHAR(10) NOT NULL, project_type VARCHAR(32) NOT NULL, surface INT DEFAULT NULL, deadline DATE DEFAULT NULL, message TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, status VARCHAR(32) NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE TABLE documents (id UUID NOT NULL, title VARCHAR(255) NOT NULL, category VARCHAR(64) NOT NULL, file_url VARCHAR(1024) NOT NULL, mime_type VARCHAR(128) NOT NULL, size_bytes INT NOT NULL, uploaded_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, visible_to_roles JSON NOT NULL, region VARCHAR(100) DEFAULT NULL, owner_user_id UUID DEFAULT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_A2B072882B18554A ON documents (owner_user_id)');
        $this->addSql('CREATE TABLE realizations (id UUID NOT NULL, title VARCHAR(255) NOT NULL, description TEXT NOT NULL, type VARCHAR(32) NOT NULL, equipment_type VARCHAR(32) NOT NULL, region VARCHAR(100) NOT NULL, before_image_url VARCHAR(1024) DEFAULT NULL, after_image_url VARCHAR(1024) DEFAULT NULL, published_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE TABLE users (id UUID NOT NULL, email VARCHAR(180) NOT NULL, password_hash VARCHAR(255) NOT NULL, role VARCHAR(32) NOT NULL, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, region VARCHAR(100) DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_users_email ON users (email)');
        $this->addSql('ALTER TABLE documents ADD CONSTRAINT FK_A2B072882B18554A FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE SET NULL NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE documents DROP CONSTRAINT FK_A2B072882B18554A');
        $this->addSql('DROP TABLE contact_requests');
        $this->addSql('DROP TABLE documents');
        $this->addSql('DROP TABLE realizations');
        $this->addSql('DROP TABLE users');
    }
}
