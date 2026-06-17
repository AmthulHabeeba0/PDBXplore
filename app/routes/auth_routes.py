from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from ..database import get_db
from ..models import User
from ..schemas import UserCreate
from ..security import  hash_otp, verify_otp_code
from ..security import hash_password, verify_password, create_access_token, verify_token
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse
from ..security import ACCESS_TOKEN_EXPIRE_MINUTES
from ..email_utils import send_otp_email
from ..security import generate_otp
from pydantic import BaseModel,EmailStr
from fastapi import Request
from ..main import limiter
import os

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

def _fail_otp(user, db, detail):
    user.otp_attempts += 1
    if user.otp_attempts >= 5:
        user.otp_locked_until = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    raise HTTPException(status_code=400, detail=detail)

@router.post("/register")
@limiter.limit("3/10minutes")
def register(
    request: Request,
    user: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    GENERIC_RESPONSE = {
        "message": "If this email is not already registered, we've sent a verification code to it."
    }

    existing_user = db.query(User).filter(User.email == user.email).first()

    # Existing verified account — say nothing, send nothing
    if existing_user and existing_user.is_verified:
        return GENERIC_RESPONSE

    # Existing unverified account — resend OTP, respecting cooldown
    if existing_user and not existing_user.is_verified:
        if (
            existing_user.last_otp_sent and
            datetime.utcnow() - existing_user.last_otp_sent < timedelta(seconds=60)
        ):
            # Within cooldown — respond identically, don't resend
            return GENERIC_RESPONSE

        otp = generate_otp()
        existing_user.otp_code = hash_otp(otp)
        existing_user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
        existing_user.otp_attempts = 0
        existing_user.otp_locked_until = None
        existing_user.last_otp_sent = datetime.utcnow()
        db.commit()

        background_tasks.add_task(send_otp_email, user.email, otp)
        return GENERIC_RESPONSE

    # New registration
    otp = generate_otp()

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        otp_code=hash_otp(otp),
        otp_expiry=datetime.utcnow() + timedelta(minutes=10),
        is_verified=False,
        otp_attempts=0,
        otp_locked_until=None,
        last_otp_sent=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()

    background_tasks.add_task(send_otp_email, user.email, otp)
    return GENERIC_RESPONSE


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

@router.post("/verify-otp")
@limiter.limit("5/10minutes")
def verify_otp(
    request: Request,
    data: OTPVerify,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification request"
        )

    if user.otp_locked_until and datetime.utcnow() < user.otp_locked_until:
        raise HTTPException(
            status_code=429,
            detail="Too many OTP attempts. Try again later."
        )

    if user.is_verified:
        return {
            "message": "Invalid verification request"
        }

    if datetime.utcnow() > user.otp_expiry:
        _fail_otp(user, db, "OTP expired")

    if not user.otp_code or not verify_otp_code(data.otp, user.otp_code):
        _fail_otp(user, db, "Invalid OTP")

    # SUCCESS
    user.is_verified = True
    user.otp_code = None
    user.otp_expiry = None
    user.otp_attempts = 0
    user.otp_locked_until = None

    db.commit()

    return {"message": "Email verified successfully"}

IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()

    # User not found
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Password incorrect
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Email not verified
    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in"
        )

    access_token = create_access_token(data={"sub": user.email})

    response = JSONResponse(content={
        "message": "Login successful",
        "username": user.username,
        "email": user.email
    })

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    return response

@router.post("/logout")
def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="access_token", path="/")
    return response

@router.get("/protected")
def protected_route(current_user: str = Depends(verify_token)):
    return {"message": f"Welcome {current_user}, this is protected"}
