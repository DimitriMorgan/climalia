<?php

declare(strict_types=1);

namespace App\Enum;

/**
 * Public visé par un document.
 *  - INTERNAL : ressource interne ou partagée (visibilité par rôle/région : employés, partenaires).
 *  - CLIENT   : livrable destiné à des entreprises clientes (affecté via assignedClients).
 */
enum DocumentAudience: string
{
    case INTERNAL = 'INTERNAL';
    case CLIENT = 'CLIENT';
}
