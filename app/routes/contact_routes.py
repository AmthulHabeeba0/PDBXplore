from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from app.database import get_db
from app.models import Contact
 
 
class ContactCreate(BaseModel):
    name: str = Field(..., max_length=100)
    email: EmailStr
    message: str = Field(..., max_length=1000)
 
 
router = APIRouter(prefix="/contact", tags=["Contact"])
 
@router.post("/")
def save_contact(data: ContactCreate, db: Session = Depends(get_db)):
 
    message = Contact(
        name=data.name,
        email=data.email,
        message=data.message
    )
 
    db.add(message)
 
    db.commit()
 
    return {"message":"Message stored successfully"}