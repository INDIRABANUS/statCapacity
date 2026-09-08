from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.db.mongodb import get_database
from app.db.users_db import (
    create_user, get_user_by_email, get_user_by_username,
    update_last_login, format_user_doc
)
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister):
    db = get_database()
    
    # Check duplicate email
    if get_user_by_email(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )
    
    # Check duplicate username
    if get_user_by_username(db, user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username already exists."
        )
    
    # Hash password & create user (always USER role for public registration)
    pwd_hash = hash_password(user_in.password)
    user_doc = create_user(db, username=user_in.username, email=user_in.email, password_hash=pwd_hash, role="USER")
    
    # Generate JWT
    token_data = {
        "sub": user_doc["id"],
        "username": user_doc["username"],
        "email": user_doc["email"],
        "role": user_doc["role"]
    }
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_doc
    }

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin):
    db = get_database()
    
    term = login_in.email_or_username.strip()
    user_raw = get_user_by_email(db, term) or get_user_by_username(db, term)
    
    if not user_raw or not verify_password(login_in.password, user_raw.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password."
        )
    
    # Update last login timestamp
    user_id = str(user_raw.get("id") or user_raw.get("_id"))
    last_login = update_last_login(db, user_id)
    user_doc = format_user_doc(user_raw)
    user_doc["last_login"] = last_login
    
    # Generate JWT
    token_data = {
        "sub": user_doc["id"],
        "username": user_doc["username"],
        "email": user_doc["email"],
        "role": user_doc["role"]
    }
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_doc
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
