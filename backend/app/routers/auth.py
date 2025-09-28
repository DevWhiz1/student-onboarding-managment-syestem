from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.schemas import UserCreate, User, LoginRequest, Token, UserRole
from app.core.firebase import get_firebase_auth, get_firestore_db
from app.core.config import settings
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import uuid
import hashlib

# In-memory database for development when Firebase is not available
dev_users_db = {}

router = APIRouter()
security = HTTPBearer()

# Use a simpler hashing method for development
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # For development, use simple hash comparison
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def get_password_hash(password: str) -> str:
    # For development, use simple SHA256 hashing
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return email
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/register", response_model=User)
async def register(user_data: UserCreate):
    """Register a new user"""
    db = get_firestore_db()
    
    if db is None:
        # Use in-memory database for development
        if user_data.email in dev_users_db:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_data.password)
        
        user_doc = {
            'id': user_id,
            'email': user_data.email,
            'name': user_data.name,
            'role': user_data.role.value,
            'password_hash': hashed_password,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        dev_users_db[user_data.email] = user_doc
        
        # Return user without password
        user_response = user_doc.copy()
        user_response.pop('password_hash')
        return User(**user_response)
    else:
        # Use Firebase
        # Check if user already exists
        users_ref = db.collection('users')
        query = users_ref.where('email', '==', user_data.email).limit(1)
        existing_users = query.get()
        
        if existing_users:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_data.password)
        
        user_doc = {
            'id': user_id,
            'email': user_data.email,
            'name': user_data.name,
            'role': user_data.role.value,
            'password_hash': hashed_password,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        db.collection('users').document(user_id).set(user_doc)
        
        # Return user without password
        user_doc.pop('password_hash')
        return User(**user_doc)

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    """Login user and return access token"""
    db = get_firestore_db()
    
    if db is None:
        # Use in-memory database for development
        if login_data.email not in dev_users_db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        user_doc = dev_users_db[login_data.email]
        
        # Verify password
        if not verify_password(login_data.password, user_doc['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user_doc['email'], "role": user_doc['role']}, 
            expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        # Use Firebase
        # Find user by email
        users_ref = db.collection('users')
        query = users_ref.where('email', '==', login_data.email).limit(1)
        users = query.get()
        
        if not users:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        user_doc = users[0].to_dict()
        
        # Verify password
        if not verify_password(login_data.password, user_doc['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user_doc['email'], "role": user_doc['role']}, 
            expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def get_current_user(current_user_email: str = Depends(verify_token)):
    """Get current user information"""
    db = get_firestore_db()
    
    if db is None:
        # Use in-memory database for development
        if current_user_email not in dev_users_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_doc = dev_users_db[current_user_email].copy()
        user_doc.pop('password_hash', None)  # Remove password hash
        
        return User(**user_doc)
    else:
        # Use Firebase
        # Find user by email
        users_ref = db.collection('users')
        query = users_ref.where('email', '==', current_user_email).limit(1)
        users = query.get()
        
        if not users:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_doc = users[0].to_dict()
        user_doc.pop('password_hash', None)  # Remove password hash
        
        return User(**user_doc)

@router.post("/logout")
async def logout():
    """Logout user (client should remove token)"""
    return {"message": "Successfully logged out"}
