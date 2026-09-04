<?php

declare(strict_types=1);

namespace App\Enum;

/**
 * Segment d'un compte client (principalement tertiaire / industriel en pratique).
 */
enum ClientSegment: string
{
    case PARTICULIER = 'PARTICULIER';
    case RESIDENTIEL = 'RESIDENTIEL';
    case TERTIAIRE = 'TERTIAIRE';
    case INDUSTRIEL = 'INDUSTRIEL';
    case SYNDIC = 'SYNDIC';
}
