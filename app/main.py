from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from . import models
from .routes.auth_routes import router as auth_router
from .routes.analysis_routes import router as analysis_router
from .routes.user_routes import router as user_router
from app.routes import protein_routes, contact_routes
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler
from fastapi import Request
from .routes.analysis_routes import cleanup_old_jobs
import asyncio
import os 


IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

app = FastAPI(
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json"
)

CLEANUP_INTERVAL_SECONDS = 5 * 60  # run every 5 minutes


async def periodic_cleanup():
    while True:
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
        cleanup_old_jobs()


@app.on_event("startup")
async def start_cleanup_task():
    asyncio.create_task(periodic_cleanup())

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_client_ip)
app.state.limiter = limiter

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

Base.metadata.create_all(bind=engine)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST","PUT","DELETE","PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)


app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(protein_routes.router)
app.include_router(contact_routes.router)
app.include_router(user_router)

@app.get("/")
def read_root():
    return {"message": "PDBXplore Backend Running Successfully with SQL Server"}
