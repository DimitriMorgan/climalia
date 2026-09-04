<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260705164739 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'users.active (connexion autorisée) + users.notify_on_new_document (e-mails de notification).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD active BOOLEAN DEFAULT true NOT NULL');
        $this->addSql('ALTER TABLE users ADD notify_on_new_document BOOLEAN DEFAULT true NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP active');
        $this->addSql('ALTER TABLE users DROP notify_on_new_document');
    }
}
