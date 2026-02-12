from fastapi import FastAPI
from .database import engine, Base
from . import models

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "PDBXplore Backend Running Successfully with SQL Server"}
