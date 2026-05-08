<?php

declare(strict_types=1);

namespace App\Enum;

enum ContactStatus: string
{
    case NEW = 'NEW';
    case CONTACTED = 'CONTACTED';
    case CLOSED = 'CLOSED';
}
