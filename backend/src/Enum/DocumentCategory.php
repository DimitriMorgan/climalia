<?php

declare(strict_types=1);

namespace App\Enum;

enum DocumentCategory: string
{
    case PLANNING = 'PLANNING';
    case TECHNICAL_SHEET = 'TECHNICAL_SHEET';
    case MAINTENANCE_CONTRACT = 'MAINTENANCE_CONTRACT';
    case INTERNAL_DOC = 'INTERNAL_DOC';
    case INTERVENTION_REPORT = 'INTERVENTION_REPORT';
    case MAINTENANCE_CERTIFICATE = 'MAINTENANCE_CERTIFICATE';
    case INVOICE = 'INVOICE';
}
