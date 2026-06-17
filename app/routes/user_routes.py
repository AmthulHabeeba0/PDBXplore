from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UpdateUsername, UpdatePassword
from ..security import verify_token, hash_password,verify_password

router = APIRouter(
    prefix="/user",
    tags=["User Settings"]
)


# ==========================
# GET CURRENT USER
# ==========================

@router.get("/me")
def get_current_user(
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    user = db.query(User).filter(User.email == current_user).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "username": user.username,
        "email": user.email
    }


# ==========================
# UPDATE USERNAME
# ==========================

@router.put("/update-username")
def update_username(
    data: UpdateUsername,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):

    user = db.query(User).filter(User.email == current_user).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(User).filter(User.username == data.username).first()

    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    user.username = data.username

    db.commit()

    return {"message": "Username updated successfully"}


# ==========================
# UPDATE PASSWORD
# ==========================

@router.put("/update-password")
def update_password(
    data: UpdatePassword,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    user = db.query(User).filter(User.email == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    user.hashed_password = hash_password(data.password)
    db.commit()
    return {"message": "Password updated successfully"}

# ==========================
# DELETE ACCOUNT
# ==========================

@router.delete("/delete")
def delete_account(
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):

    user = db.query(User).filter(User.email == current_user).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "Account deleted successfully"}


