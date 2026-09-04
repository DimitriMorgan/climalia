<?php

declare(strict_types=1);

namespace App\Enum;

enum UserRole: string
{
    case EMPLOYEE = 'EMPLOYEE';
    case PARTNER = 'PARTNER';
    case ADMIN = 'ADMIN';
    case EDITOR = 'EDITOR';
    case CLIENT = 'CLIENT';

    public function asSecurityRole(): string
    {
        return 'ROLE_' . $this->value;
    }
}
