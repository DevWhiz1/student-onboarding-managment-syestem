from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # API Keys
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
    sendgrid_api_key: str = os.getenv("SENDGRID_API_KEY", "")
    
    # Firebase Configuration
    firebase_project_id: str = os.getenv("FIREBASE_PROJECT_ID", "")
    firebase_private_key_id: str = os.getenv("FIREBASE_PRIVATE_KEY_ID", "")
    firebase_private_key: str = os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n')
    firebase_client_email: str = os.getenv("FIREBASE_CLIENT_EMAIL", "")
    firebase_client_id: str = os.getenv("FIREBASE_CLIENT_ID", "")
    firebase_auth_uri: str = os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth")
    firebase_token_uri: str = os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token")
    
    # Email Configuration
    from_email: str = os.getenv("FROM_EMAIL", "noreply@studentmanagement.com")
    
    # JWT Configuration
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./student_management.db")
    
    class Config:
        env_file = ".env"

settings = Settings()
