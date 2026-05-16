#!/bin/sh
set -e

# Pin APP_ENV/APP_DEBUG au cas où (l'image est --no-dev de toute façon)
: "${APP_ENV:=prod}"
: "${APP_DEBUG:=0}"
export APP_ENV APP_DEBUG

cd /app

# -----------------------------------------------------------------------------
# Génération des clés JWT (premier déploiement)
# Le volume climalia_jwt monte /app/config/jwt et persiste entre redeploys.
# -----------------------------------------------------------------------------
if [ ! -f "${JWT_SECRET_KEY}" ] || [ ! -f "${JWT_PUBLIC_KEY}" ]; then
	echo "→ Generating JWT keypair (first run)..."
	mkdir -p "$(dirname "${JWT_SECRET_KEY}")"
	php bin/console lexik:jwt:generate-keypair --skip-if-exists --no-interaction
	chown www-data:www-data "${JWT_SECRET_KEY}" "${JWT_PUBLIC_KEY}"
	chmod 644 "${JWT_PUBLIC_KEY}"
	chmod 600 "${JWT_SECRET_KEY}"
fi

# -----------------------------------------------------------------------------
# Permissions du volume var/ (cache + logs)
# -----------------------------------------------------------------------------
mkdir -p var/cache var/log
chown -R www-data:www-data var

# Cache prod fraîchement chauffé (var/ est un volume persistent, on repart propre)
rm -rf var/cache/prod 2>/dev/null || true
php bin/console cache:warmup --no-interaction --env=prod

exec "$@"
