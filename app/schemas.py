from pydantic import BaseModel, EmailStr, field_validator
import re



class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_]{3,20}$", v):
            raise ValueError(
                "Username must be 3-20 characters long and contain only letters, numbers, or underscore"
                )
        return v
    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str
