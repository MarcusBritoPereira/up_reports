"""Compat layer para configuração legada.

Preferir usar `app.core.config.settings` em novos módulos.
"""

from app.core.config import settings

META_PAGE_ID = settings.meta_page_id
META_IG_ID = settings.meta_ig_id
META_ACCESS_TOKEN = settings.meta_access_token
META_BASE_URL = settings.meta_base_url
