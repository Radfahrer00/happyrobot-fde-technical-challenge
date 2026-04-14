from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_key: str = "dev-api-key"
    fmcsa_api_key: str = ""
    database_url: str = "sqlite:///./calls.db"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
_bearer = HTTPBearer(auto_error=True)


def verify_api_key(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> str:
    if credentials.credentials != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    return credentials.credentials
