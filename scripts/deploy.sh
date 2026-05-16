#!/usr/bin/env bash
# Climalia — déploiement prod sur le VPS Hetzner.
# Prérequis :
#   - Alias SSH "vps" configuré dans ~/.ssh/config
#   - /opt/projects/climalia/.env.prod déjà présent sur le VPS (cf. README)
#   - Network Docker externe "web" déjà créé par le stack Caddy (/opt/projects/_caddy)
#
# Usage : ./scripts/deploy.sh

set -euo pipefail

REMOTE_HOST="vps"
REMOTE_BASE="/opt/projects/climalia"

# FIX bug #3 : --env-file .env.prod sur TOUTES les commandes docker compose
COMPOSE="docker compose -f compose.prod.yaml --env-file .env.prod"

cd "$(dirname "$0")/.."

echo "→ [1/5] Sync code → ${REMOTE_HOST}:${REMOTE_BASE}"
rsync -az --delete \
	--exclude '.git/' \
	--exclude '.idea/' \
	--exclude '.vscode/' \
	--exclude 'node_modules/' \
	--exclude 'frontend/node_modules/' \
	--exclude 'frontend/dist/' \
	--exclude 'frontend/cypress/screenshots/' \
	--exclude 'frontend/cypress/videos/' \
	--exclude 'backend/vendor/' \
	--exclude 'backend/var/' \
	--exclude '.env' \
	--exclude '.env.local' \
	--exclude '.env.prod' \
	--exclude '.env.prod.local' \
	--exclude 'backend/config/jwt/*.pem' \
	--exclude '.phpunit.cache' \
	./ "${REMOTE_HOST}:${REMOTE_BASE}/"

echo "→ [2/5] Build images"
ssh "${REMOTE_HOST}" "cd ${REMOTE_BASE} && ${COMPOSE} build"

echo "→ [3/5] Up (db + app, recreate si besoin)"
ssh "${REMOTE_HOST}" "cd ${REMOTE_BASE} && ${COMPOSE} up -d --remove-orphans"

echo "→ [4/5] Migrations Doctrine"
# Petit délai pour laisser le healthcheck postgres + l'entrypoint app terminer
sleep 5
ssh "${REMOTE_HOST}" "cd ${REMOTE_BASE} && ${COMPOSE} exec -T app php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration"

echo "→ [5/5] État"
ssh "${REMOTE_HOST}" "cd ${REMOTE_BASE} && ${COMPOSE} ps"

echo "✓ Déploiement terminé : https://climalia.dimitrifruit.dev"
