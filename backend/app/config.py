from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Azure OpenAI — used for EMBEDDINGS (text-embedding-ada-002)
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_embedding_deployment: str = "text-embedding-ada-002"
    azure_openai_api_version: str = "2024-08-01-preview"

    # Azure AI Foundry — used for CHAT (gpt-oss-120b open model).
    # Separate resource because Azure-for-Students has no GPT chat quota;
    # the open model is served from an AIServices/Foundry account.
    azure_chat_endpoint: str = ""
    azure_chat_api_key: str = ""
    azure_chat_deployment: str = "gpt-oss-120b"
    azure_chat_api_version: str = "2024-10-21"

    # Azure AI Search
    azure_search_endpoint: str = ""
    azure_search_api_key: str = ""
    azure_search_index_name: str = "tibu-knowledge-base"

    # OpenRouteService — walking directions on the Campus Navigator map.
    # Free key from https://openrouteservice.org/dev/#/signup
    # Optional: without it, /api/map/route falls back to a straight line.
    openrouteservice_api_key: str = ""

    # Supabase — storage + metadata for Study Hub past papers.
    # Project settings → API. Use the SERVICE ROLE key (server-side only).
    # Optional: without these, uploads fall back to the Azure Search index.
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_bucket: str = "past-papers"

    # Database (optional — app works without it)
    database_url: str = ""

    # Admin
    admin_password: str = "tibu-admin-2026"

    # App
    app_env: str = "development"
    cors_origins: str = "http://localhost:5173,https://lively-glacier-038da2a0f.2.azurestaticapps.net,https://tibu-production.up.railway.app"

    model_config = {"env_file": "../.env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
