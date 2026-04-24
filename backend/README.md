# Backend (FastAPI)

## Estrutura

- `app/main.py`: bootstrap da aplicação
- `app/api/v1/router.py`: agregador de rotas versionadas
- `app/core/config.py`: configurações por ambiente
- `app/core/errors.py`: handlers globais de erro
- `app/core/logging.py`: setup de logs
- `app/routers/*`: endpoints de domínio

## Variáveis de ambiente

- `APP_NAME`
- `APP_ENV`
- `APP_DEBUG`
- `APP_CORS_ORIGINS` (separado por vírgula)
- `APP_SECRET`
- `DATABASE_URL`
- `META_PAGE_ID`
- `META_IG_ID`
- `META_ACCESS_TOKEN`
- `META_BASE_URL`

## Rotas

- `GET /` status da aplicação
- `GET /healthz` healthcheck
- `GET/POST/DELETE /api/v1/clients`
- `GET /api/v1/instagram/profile`
- `GET /api/v1/instagram/insights`
- `GET /api/v1/instagram/media`
- `GET /api/v1/ads/campaigns`

## Segurança (fase 1)

- `POST /api/v1/auth/register` cria o primeiro usuário como `admin`.
- `POST /api/v1/auth/login` retorna token bearer assinado.
- `GET /api/v1/auth/me` retorna usuário autenticado.
- Rotas de clients/instagram exigem autenticação; ações de gestão exigem perfil `admin`.
