# syntax=docker/dockerfile:1.7
FROM dunglas/frankenphp:1.12-php8.4-trixie AS base

# install-php-extensions est livré dans l'image FrankenPHP
RUN install-php-extensions \
        pdo_pgsql \
        intl \
        opcache \
        zip \
        gd \
        sodium \
        apcu

# Composer
COPY --from=composer:2.9 /usr/bin/composer /usr/bin/composer

# Symfony CLI (utile pour les devs et tests)
RUN curl -1sLf https://get.symfony.com/cli/installer | bash \
    && mv /root/.symfony5/bin/symfony /usr/local/bin/symfony

# Outils utilitaires
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        make \
        bash-completion \
    && rm -rf /var/lib/apt/lists/*

# Configuration PHP : production-ready, surchargée en dev par mount volume si besoin
ENV PHP_INI_DIR=/usr/local/etc/php
COPY docker/frankenphp/php.ini $PHP_INI_DIR/conf.d/zz-app.ini

# Configuration Caddy/FrankenPHP
COPY docker/frankenphp/Caddyfile /etc/caddy/Caddyfile

# Entrypoint custom : génère les clés JWT au premier démarrage si absentes
COPY docker/frankenphp/entrypoint.sh /usr/local/bin/app-entrypoint
RUN chmod +x /usr/local/bin/app-entrypoint

WORKDIR /app

# FrankenPHP est l'entrypoint par défaut de l'image — on le wrappe
ENTRYPOINT ["/usr/local/bin/app-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
