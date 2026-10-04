# Climalia

## Debug prod

La prod tourne sur le VPS Hetzner (`ssh vps`, `/opt/projects/climalia`), derrière le Caddy partagé.
Logs (Loki, 14 jours), métriques (Prometheus) et alertes (Telegram) sont centralisés par la stack
`~/projects/observability` (runbook : `docs/OBSERVABILITY.md`).

- **Diagnostiquer : skill `prod-debug`** (serveur MCP Grafana en lecture seule — Loki, Prometheus,
  dashboards, alertes). Ne pas se connecter en SSH pour lire des logs : tout est dans Loki.
- Logs de cette app : `{app="climalia"}` ; conteneurs : `climalia-app` (FrankenPHP), `climalia-db`.
- Dashboards : `app` (variable `app=climalia`), `containers`, `http-traffic`, `debug-journey`.
- Démo client. Le healthcheck Docker de `climalia-app` est connu comme cassé (« unhealthy » sans incidence).
- **Aucune action corrective en prod sans accord explicite** (restart, deploy, migration, commande
  docker). Déploiement : `./scripts/deploy.sh`.
