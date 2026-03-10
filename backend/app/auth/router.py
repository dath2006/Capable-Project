from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from . import schemas, models
from .utils import (
    hash_password, verify_password,
    create_access_token, generate_reset_token, get_reset_expiry,
)
from .dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.UserOut)
def signup(req: schemas.SignupRequest, db: Session = Depends(get_db)):
    if req.password != req.confirm_password:
        raise HTTPException(400, "Passwords do not match")
    if db.query(models.User).filter(
        models.User.username == req.username
    ).first():
        raise HTTPException(409, "Username already taken")
    if db.query(models.User).filter(
        models.User.email == req.email
    ).first():
        raise HTTPException(409, "Email already registered")
    user = models.User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        study_field=req.study_field,
        semester=req.semester,
        college_name=req.college_name,
        phone=req.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == req.username
    ).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": user.username})
    return schemas.TokenResponse(access_token=token)


@router.post("/forgot-password")
def forgot_password(
    req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.email == req.email
    ).first()
    if not user:
        raise HTTPException(404, "Email not found")
    user.reset_token = generate_reset_token()
    user.reset_token_expiry = get_reset_expiry()
    db.commit()
    return {"message": "Reset token generated", "token": user.reset_token}


@router.post("/reset-password")
def reset_password(
    req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)
):
    if req.new_password != req.confirm_password:
        raise HTTPException(400, "Passwords do not match")
    user = db.query(models.User).filter(
        models.User.reset_token == req.token
    ).first()
    if not user or user.reset_token_expiry < datetime.now(timezone.utc):
        raise HTTPException(400, "Invalid or expired reset token")
    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    return {"message": "Password reset successful"}
