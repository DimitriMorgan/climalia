#!/bin/sh
set -e

# Pin APP_ENV/APP_DEBUG au cas où (l'image est --no-dev de toute façon)
: "${APP_ENV:=prod}"
: "${APP_DEBUG:=0}"
export APP_ENV APP_DEBUG

cd /app

# -----------------------------------------------------------------------------
# Génération des clés JWT.
# Le volume climalia_jwt monte /app/config/jwt et persiste entre redeploys.
#
# On (re)génère si :
#   - une des deux clés est absente (premier déploiement), OU
#   - la clé privée existante ne s'ouvre pas avec JWT_PASSPHRASE courante
#     (cas d'une passphrase modifiée après coup : sinon tout signage de JWT
#      échoue avec un 500 « unable to encode JWT token »).
# -----------------------------------------------------------------------------
need_jwt_keys=0
if [ ! -f "${JWT_SECRET_KEY}" ] || [ ! -f "${JWT_PUBLIC_KEY}" ]; then
	need_jwt_keys=1
elif ! openssl pkey -in "${JWT_SECRET_KEY}" -passin "pass:${JWT_PASSPHRASE}" -noout >/dev/null 2>&1; then
	echo "→ JWT private key does not match JWT_PASSPHRASE — regenerating."
	need_jwt_keys=1
fi

if [ "${need_jwt_keys}" = "1" ]; then
	echo "→ Generating JWT keypair..."
	mkdir -p "$(dirname "${JWT_SECRET_KEY}")"
	php bin/console lexik:jwt:generate-keypair --overwrite --no-interaction
	chown www-data:www-data "${JWT_SECRET_KEY}" "${JWT_PUBLIC_KEY}"
	chmod 644 "${JWT_PUBLIC_KEY}"
	chmod 600 "${JWT_SECRET_KEY}"
fi

# -----------------------------------------------------------------------------
# Permissions des volumes inscriptibles (var/ : cache+logs ; public/uploads/ : médias)
# Le volume climalia_uploads peut arriver root-owned : on garantit l'accès www-data
# sinon $file->move() échoue en 500 sur l'upload.
# -----------------------------------------------------------------------------
mkdir -p var/cache var/log public/uploads
chown -R www-data:www-data var public/uploads

# Cache prod fraîchement chauffé (var/ est un volume persistent, on repart propre)
rm -rf var/cache/prod 2>/dev/null || true
php bin/console cache:warmup --no-interaction --env=prod

exec "$@"
