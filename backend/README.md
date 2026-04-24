# Backend (FastAPI)

## Estrutura

- `app/main.py`: bootstrap da aplicação + middleware de observabilidade (`X-Request-ID`)
- `app/api/v1/router.py`: agregador de rotas versionadas
- `app/core/config.py`: configurações por ambiente
- `app/core/errors.py`: handlers globais de erro
- `app/core/logging.py`: setup de logs
- `app/core/security.py`: hash de senha + tokens de acesso/refresh
- `app/core/secrets.py`: cifragem de segredos em repouso
- `app/core/audit.py`: utilitário de auditoria
- `app/routers/*`: endpoints de domínio
- `alembic/*`: migrations do banco

## Variáveis de ambiente

- `APP_NAME`
- `APP_ENV`
- `APP_DEBUG`
- `APP_CORS_ORIGINS` (separado por vírgula)
- `APP_SECRET`
- `DATABASE_URL`
- `AUTH_ACCESS_TOKEN_TTL_SECONDS`
- `AUTH_REFRESH_TOKEN_TTL_SECONDS`
- `AUTH_ALLOW_PUBLIC_REGISTRATION`
- `OAUTH_SESSION_TTL_SECONDS`
- `FRONTEND_URL`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_OAUTH_REDIRECT_URI`
- `META_PAGE_ID`
- `META_IG_ID`
- `META_ACCESS_TOKEN`
- `META_BASE_URL`

## Rotas

- `GET /` status da aplicação
- `GET /healthz` healthcheck
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users` (admin)
- `POST /api/v1/users` (admin)
- `PATCH /api/v1/users/{user_id}` (admin)
- `GET /api/v1/oauth/meta/start` (admin)
- `GET /api/v1/oauth/meta/callback`
- `GET /api/v1/oauth/meta/pending/{oauth_session}` (admin)
- `POST /api/v1/oauth/meta/complete` (admin)
- `GET /api/v1/oauth/meta/reconnect-required`
- `GET/POST/DELETE /api/v1/clients`
- `POST /api/v1/clients/{client_id}/access` (admin)
- `GET /api/v1/instagram/profile`
- `GET /api/v1/instagram/insights`
- `GET /api/v1/instagram/media`
- `GET /api/v1/ads/campaigns`
- `POST /api/v1/reports/snapshots/collect`
- `GET /api/v1/reports/snapshots`
- `GET /api/v1/reports/summary`
- `GET /api/v1/reports/export/csv`
- `GET /api/v1/reports/export/pdf`

## Sprint A (segurança/infra)

- Persistência de estado OAuth em banco (`oauth_sessions`) com expiração/cleanup.
- Migration Alembic inicial (`alembic/versions/0001_init.py`).
- Middleware de observabilidade com `request_id`.

## Sprint B (dados/relatórios)

- Snapshot diário sob demanda (`metric_snapshots`).
- Endpoints de resumo e histórico.
- Exportação CSV e PDF básico.

## Sprint C (produto/escala)

- Seleção de Página + BM/Ad Account no fluxo OAuth.
- Endpoint para detectar reconexão necessária.
- Auditoria de ações de relatório.
