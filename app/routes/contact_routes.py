from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from app.database import get_db
from app.models import Contact
from app.main import limiter


class ContactCreate(BaseModel):
    name: str = Field(..., max_length=100)
    email: EmailStr
    message: str = Field(..., max_length=500)


router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post("/")
@limiter.limit("5/hour")
def save_contact(request: Request, data: ContactCreate, db: Session = Depends(get_db)):
    message = Contact(
        name=data.name,
        email=data.email,
        message=data.message
    )
    db.add(message)
    db.commit()
    return {"message": "Message stored successfully"}