from fastapi import FastAPI
from .database import engine, Base
from . import models
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import User
from .schemas import UserCreate, UserLogin
from .security import hash_password, verify_password, create_access_token
from .security import verify_token
from fastapi.security import OAuth2PasswordBearer
from .routes.auth_routes import router as auth_router
from .routes.analysis_routes import router as analysis_router
from .database import engine
from fastapi.staticfiles import StaticFiles
from app.routes import protein_routes





app = FastAPI()

Base.metadata.create_all(bind=engine)


app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(protein_routes.router)
app.mount("/static", StaticFiles(directory="app/plots"), name="static")

@app.get("/")
def read_root():
    return {"message": "PDBXplore Backend Running Successfully with SQL Server"}


