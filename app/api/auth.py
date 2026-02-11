from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from supabase import Client
from typing import Optional

from app.core.deps import get_supabase

router = APIRouter()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None
    full_name: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserRegister,
    supabase: Client = Depends(get_supabase)
):
    """Registra un nuovo utente su Supabase Auth"""
    try:
        # Prepare metadata
        metadata = {}
        if user_data.username:
            metadata["username"] = user_data.username
        if user_data.full_name:
            metadata["full_name"] = user_data.full_name
            
        # Signup on Supabase
        auth_response = supabase.auth.sign_up({
            "email": user_data.email, 
            "password": user_data.password,
            "options": {
                "data": metadata
            }
        })
        
        if not auth_response.user or not auth_response.session:
            # Check if email confirmation is required
            if auth_response.user and not auth_response.session:
                raise HTTPException(
                    status_code=status.HTTP_201_CREATED, 
                    detail="Registration successful. Please check your email to confirm your account."
                )
            raise HTTPException(status_code=400, detail="Registration failed")
            
        return {
            "access_token": auth_response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "user_metadata": auth_response.user.user_metadata
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error registering user: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    user_data: UserLogin,
    supabase: Client = Depends(get_supabase)
):
    """Accedi tramite email e password"""
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        return {
            "access_token": auth_response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "user_metadata": auth_response.user.user_metadata
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
