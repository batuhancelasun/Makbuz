from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "makbuz-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Password from environment variable (default for first setup)
APP_PASSWORD = os.getenv("MAKBUZ_PASSWORD", "makbuz123")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str) -> bool:
    """Verify password against the app password"""
    return plain_password == APP_PASSWORD

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> bool:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("authenticated") == True
    except JWTError:
        return False

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Dependency to check authentication"""
    # Check for token in Authorization header
    if credentials:
        if verify_token(credentials.credentials):
            return True
    
    # Check for token in cookie
    token = request.cookies.get("makbuz_token")
    if token and verify_token(token):
        return True
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

