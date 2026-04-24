# Backend (FastAPI)

## Estrutura

- `app/main.py`: bootstrap da aplicação
- `app/api/v1/router.py`: agregador de rotas versionadas
- `app/core/config.py`: configurações por ambiente
- `app/core/errors.py`: handlers globais de erro
- `app/core/logging.py`: setup de logs
- `app/core/security.py`: hash de senha + tokens de acesso/refresh
- `app/routers/*`: endpoints de domínio

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
- `GET/POST/DELETE /api/v1/clients`
- `POST /api/v1/clients/{client_id}/access` (admin)
- `GET /api/v1/instagram/profile`
- `GET /api/v1/instagram/insights`
- `GET /api/v1/instagram/media`
- `GET /api/v1/ads/campaigns`

## Segurança

- Registro público pode ser bloqueado via `AUTH_ALLOW_PUBLIC_REGISTRATION=false`.
- Primeiro usuário pode ser criado via `/auth/register` quando base está vazia.
- Login possui proteção simples contra força-bruta (bloqueio temporário por tentativas).
- Resposta de `clients` não expõe `access_token`.
- `refresh_token` é rotacionado no endpoint `/auth/refresh` e o antigo é revogado.
- `access_token` de cliente é armazenado cifrado (envelope `enc:v1`).

## Fluxo OAuth Meta (nova UX)

1. Usuário informa apenas nome do cliente e clica em **Entrar com Instagram** ou **Entrar com Facebook**.
2. Backend cria URL OAuth e redireciona para Meta Login.
3. Callback troca `code` por token, busca página/IG Business e cria/atualiza o cliente automaticamente.
4. O token é armazenado cifrado e nunca exibido na UI.
5. Ao concluir, o usuário que iniciou o OAuth é vinculado automaticamente ao cliente criado/atualizado.
