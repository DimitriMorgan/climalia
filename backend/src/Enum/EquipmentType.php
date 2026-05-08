<?php

declare(strict_types=1);

namespace App\Enum;

enum EquipmentType: string
{
    case AC = 'AC';
    case HEAT_PUMP = 'HEAT_PUMP';
    case VMC = 'VMC';
}
