#!/usr/bin/env bash
set -euo pipefail

cd /app

# Si la config Symfony n'existe pas encore (premier run avant bootstrap), on
# laisse FrankenPHP démarrer quand même pour permettre `make bash-back`.
if [ -f composer.json ] && [ -z "$(ls -A vendor 2>/dev/null)" ]; then
    echo "[entrypoint] Installation des dépendances composer..."
    composer install --no-interaction --prefer-dist --no-progress
fi

# Génération des clés JWT au premier démarrage
JWT_DIR=/app/config/jwt
if [ -d /app/config ] && [ ! -f "$JWT_DIR/private.pem" ]; then
    echo "[entrypoint] Génération des clés JWT..."
    mkdir -p "$JWT_DIR"
    PASSPHRASE="${JWT_PASSPHRASE:-climalia-jwt-passphrase-change-me}"
    openssl genpkey -algorithm RSA -out "$JWT_DIR/private.pem" \
        -aes256 -pass "pass:$PASSPHRASE" -pkeyopt rsa_keygen_bits:4096 2>/dev/null
    openssl pkey -in "$JWT_DIR/private.pem" -passin "pass:$PASSPHRASE" \
        -out "$JWT_DIR/public.pem" -pubout 2>/dev/null
    chmod 644 "$JWT_DIR/public.pem"
    chmod 600 "$JWT_DIR/private.pem"
    echo "[entrypoint] Clés JWT prêtes."
fi

exec "$@"
