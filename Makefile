# --- Climalia — Makefile dev ---
# Usage: `make help`

DC      ?= docker compose
BACK    ?= $(DC) exec frankenphp
BACK_T  ?= $(DC) exec -T frankenphp

.DEFAULT_GOAL := help

.PHONY: help up down build rebuild logs ps bash-back \
        composer migrate fresh test-back phpstan cache-clear

help: ## Liste les commandes disponibles
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Démarre la stack (build si nécessaire)
	$(DC) up -d --build

down: ## Arrête la stack
	$(DC) down

build: ## (Re)build l'image FrankenPHP
	$(DC) build

rebuild: ## Force un rebuild from scratch
	$(DC) build --no-cache

logs: ## Affiche les logs de tous les services
	$(DC) logs -f --tail=200

ps: ## Liste les conteneurs
	$(DC) ps

bash-back: ## Shell dans le conteneur backend
	$(BACK) bash

composer: ## composer <args> dans le conteneur (ex: `make composer ARGS="require foo/bar"`)
	$(BACK) composer $(ARGS)

migrate: ## Applique les migrations Doctrine
	$(BACK_T) php bin/console doctrine:migrations:migrate --no-interaction

fresh: ## Reset complet : drop + create + migrate + fixtures
	$(BACK_T) php bin/console doctrine:database:drop --force --if-exists
	$(BACK_T) php bin/console doctrine:database:create
	$(BACK_T) php bin/console doctrine:migrations:migrate --no-interaction
	$(BACK_T) php bin/console doctrine:fixtures:load --no-interaction

test-back: ## Lance la suite de tests backend (PHPUnit)
	$(DC) exec -T -e APP_ENV=test frankenphp php bin/phpunit

phpstan: ## Analyse statique PHPStan niveau 8
	$(BACK_T) vendor/bin/phpstan analyse --memory-limit=1G

cache-clear: ## Vide le cache Symfony
	$(BACK_T) php bin/console cache:clear
