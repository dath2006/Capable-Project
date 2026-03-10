from pydantic import BaseModel, EmailStr
from typing import Optional


class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str
    study_field: str
    semester: Optional[str] = None
    college_name: Optional[str] = None
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    study_field: str
    semester: Optional[str] = None
    college_name: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True
