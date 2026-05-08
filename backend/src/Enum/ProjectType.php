<?php

declare(strict_types=1);

namespace App\Enum;

enum ProjectType: string
{
    case INSTALLATION_AC = 'INSTALLATION_AC';
    case HEAT_PUMP = 'HEAT_PUMP';
    case VMC = 'VMC';
    case MAINTENANCE = 'MAINTENANCE';
    case REPAIR = 'REPAIR';
}
