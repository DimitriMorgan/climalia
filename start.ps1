# Climalia — bootstrap Windows (équivalent `make up`)
# Lance Docker Desktop si nécessaire, build l'image et démarre la stack.
# Usage : .\start.ps1   |   .\start.ps1 -Fresh   |   .\start.ps1 -Down

[CmdletBinding()]
param(
    [switch]$Fresh,
    [switch]$Down,
    [switch]$Logs,
    [switch]$Migrate
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Invoke-Compose {
    param([Parameter(ValueFromRemainingArguments=$true)] [string[]]$Args)
    & docker compose @Args
    if ($LASTEXITCODE -ne 0) { throw "docker compose $($Args -join ' ') a échoué (code $LASTEXITCODE)" }
}

# 1. Vérifie Docker
try {
    docker version --format '{{.Server.Version}}' | Out-Null
} catch {
    Write-Host '⏳ Docker indisponible. Lancement de Docker Desktop...' -ForegroundColor Yellow
    $dd = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
    if (Test-Path $dd) {
        Start-Process -FilePath $dd | Out-Null
    }
    $deadline = (Get-Date).AddMinutes(2)
    while ((Get-Date) -lt $deadline) {
        try {
            docker version --format '{{.Server.Version}}' | Out-Null
            break
        } catch {
            Start-Sleep -Seconds 3
        }
    }
    docker version --format '{{.Server.Version}}' | Out-Null
}

# 2. Crée .env depuis .env.example si absent
if (-not (Test-Path '.env')) {
    if (Test-Path '.env.example') {
        Copy-Item '.env.example' '.env'
        Write-Host '📋 .env créé à partir de .env.example' -ForegroundColor Cyan
    } else {
        throw '.env.example manquant.'
    }
}

if ($Down) {
    Invoke-Compose down
    return
}

if ($Logs) {
    Invoke-Compose logs -f --tail=200
    return
}

# 3. Build + up
Write-Host '🐳 Build + démarrage de la stack...' -ForegroundColor Cyan
Invoke-Compose up -d --build

# 4. Attente du healthcheck Postgres
Write-Host '⏳ Attente Postgres...' -ForegroundColor Cyan
$retries = 30
while ($retries -gt 0) {
    $status = (docker inspect --format '{{.State.Health.Status}}' climalia_postgres 2>$null)
    if ($status -eq 'healthy') { break }
    Start-Sleep -Seconds 2
    $retries--
}
if ($retries -eq 0) { throw 'Postgres pas healthy après 60s.' }

if ($Migrate -or $Fresh) {
    Write-Host '🗃️  Migrations Doctrine...' -ForegroundColor Cyan
    if ($Fresh) {
        docker compose exec -T frankenphp php bin/console doctrine:database:drop --force --if-exists
        docker compose exec -T frankenphp php bin/console doctrine:database:create
    }
    docker compose exec -T frankenphp php bin/console doctrine:migrations:migrate --no-interaction
    if ($Fresh) {
        docker compose exec -T frankenphp php bin/console doctrine:fixtures:load --no-interaction
    }
}

Write-Host '✅ Climalia est prêt → http://localhost:8000' -ForegroundColor Green
