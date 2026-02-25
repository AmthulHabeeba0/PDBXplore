from fastapi import APIRouter, Depends, HTTPException
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from ..database import get_db
from ..models import User
from ..schemas import UserCreate
from ..security import hash_password, verify_password, create_access_token, verify_token
from datetime import datetime, timedelta
from ..email_utils import send_otp_email
from ..security import generate_otp
from pydantic import BaseModel,EmailStr

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    otp = generate_otp()

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        otp_code=otp,
        otp_expiry=datetime.utcnow() + timedelta(minutes=10),
        is_verified=False
    )

    db.add(new_user)
    db.commit()

    send_otp_email(user.email, otp)

    return {"message": "User registered. Please verify your email with OTP."}



class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

@router.post("/verify-otp")
def verify_otp(data: OTPVerify, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {"message": "User already verified"}

    if user.otp_code != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.utcnow() > user.otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired")

    user.is_verified = True
    user.otp_code = None
    user.otp_expiry = None

    db.commit()

    return {"message": "Email verified successfully"}



@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/protected")
def protected_route(current_user: str = Depends(verify_token)):
    return {"message": f"Welcome {current_user}, this is protected"}
