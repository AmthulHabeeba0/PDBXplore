from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..security import verify_token
from ..rama import generate_ramachandran_plot
from ..main import limiter
from Bio.PDB import PDBParser
import threading
import re
import time
import json

import os
import uuid

router = APIRouter(
    prefix="/analysis",
    tags=["analysis"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
PLOT_DIR = os.path.join(BASE_DIR, "plots")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PLOT_DIR, exist_ok=True)

CLEANUP_AGE_SECONDS = 30 * 60  # 30 minutes
MAX_CONCURRENT_JOBS = 3
_active_jobs = 0
_jobs_lock = threading.Lock()

def _verify_ownership(job_id: str, current_user: str):
    """Raise 404 if this job doesn't belong to current_user (or doesn't exist)."""
    meta_path = os.path.join(PLOT_DIR, f"{job_id}_meta.json")
    if not os.path.exists(meta_path):
        raise HTTPException(status_code=404, detail="Not found")
    try:
        with open(meta_path) as f:
            meta = json.load(f)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")

    if meta.get("owner") != current_user:
        raise HTTPException(status_code=404, detail="Not found")


def cleanup_old_jobs():
    """Removes plot, stats, error, and meta files for jobs older than CLEANUP_AGE_SECONDS."""
    now = time.time()
    for fname in os.listdir(PLOT_DIR):
        if not fname.endswith("_meta.json"):
            continue

        meta_path = os.path.join(PLOT_DIR, fname)
        try:
            with open(meta_path) as f:
                meta = json.load(f)
            created_at = meta.get("created_at", 0)
        except Exception:
            created_at = 0

        if now - created_at < CLEANUP_AGE_SECONDS:
            continue

        job_id = fname[: -len("_meta.json")]
        for suffix in ["_rama.png", "_rama.png.error", "_stats.json", "_meta.json"]:
            path = os.path.join(PLOT_DIR, f"{job_id}{suffix}")
            if os.path.exists(path):
                os.remove(path)


# ================================================
# BACKGROUND TASK: Generate plot after upload
# ================================================
def _generate_plot_task(pdb_path: str, plot_path: str, job_id: str):
    global _active_jobs

    try:
        generate_ramachandran_plot(pdb_path, plot_path)
    except Exception as e:
        print(f"Ramachandran generation error: {e}")
        with open(plot_path + ".error", "w") as f:
            f.write("Analysis failed")
    finally:
        if os.path.exists(pdb_path):
            os.remove(pdb_path)
        with _jobs_lock:
            _active_jobs -= 1
            
# ================================================
# POST /analysis/rama  — Upload + kick off async
# ================================================

@router.post("/rama")
@limiter.limit("5/minute")
async def generate_rama_plot_api(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    filename = file.filename.lower()
    if file.content_type not in [
        "chemical/x-pdb",
        "text/plain",
        "application/octet-stream"
        ]:
            raise HTTPException(
            status_code=400,
            detail="Invalid file type"
        )
    sample = await file.read(2048)
    await file.seek(0)
    
    if not any(
        marker in sample.decode(errors="ignore")
        for marker in ["HEADER", "ATOM", "HETATM", "MODEL"]
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDB file content"
        )
    unique_id = str(uuid.uuid4())
    pdb_filename = f"{unique_id}.pdb"
    plot_filename = f"{unique_id}_rama.png"
    pdb_path = os.path.join(UPLOAD_DIR, pdb_filename)
    plot_path = os.path.join(PLOT_DIR, plot_filename)
    
    meta_path = os.path.join(PLOT_DIR, f"{unique_id}_meta.json")
    with open(meta_path, "w") as f:
        json.dump({
            "owner": current_user,
            "created_at": time.time()
        }, f)

    # Save uploaded file immediately
    MAX_FILE_SIZE = 10 * 1024 * 1024
    size = 0

    with open(pdb_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                f.close()
                if os.path.exists(pdb_path):
                    os.remove(pdb_path)
                if os.path.exists(meta_path):
                    os.remove(meta_path)
                raise HTTPException(status_code=413, detail="File too large")
            f.write(chunk)
            
    # Validate that this is actually a parseable PDB structure with atoms
    parser = PDBParser(QUIET=True)
    try:
        structure = parser.get_structure("validation", pdb_path)
        if len(list(structure.get_atoms())) == 0:
            raise ValueError("No atoms found")
    except Exception:
        if os.path.exists(pdb_path):
            os.remove(pdb_path)
        if os.path.exists(meta_path):
            os.remove(meta_path)
        raise HTTPException(status_code=400, detail="Invalid PDB file content")
    with _jobs_lock:
        if _active_jobs >= MAX_CONCURRENT_JOBS:
            if os.path.exists(pdb_path):
                os.remove(pdb_path)
            if os.path.exists(meta_path):
                os.remove(meta_path)
            raise HTTPException(
                status_code=503,
                detail="Server busy — please try again in a moment"
            )
        _active_jobs += 1  # reserve the slot immediately
    # Kick off generation in background — return job_id instantly
    background_tasks.add_task(_generate_plot_task, pdb_path, plot_path, unique_id)

    base_url = str(request.base_url).rstrip("/")

    return {
        "message": "Plot generation started",
        "job_id": unique_id,
        "plot_filename": plot_filename,
        "status_url": f"{base_url}/analysis/status/{unique_id}",
        "preview": f"{base_url}/analysis/preview/{plot_filename}",
        "download": f"{base_url}/analysis/download/{plot_filename}"
    }


# ================================================
# GET /analysis/status/{job_id} — Poll for result
# ================================================

@router.get("/status/{job_id}")
def get_plot_status(job_id: str, request: Request,current_user: str = Depends(verify_token)):
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(400, "Invalid job ID")
    
    _verify_ownership(job_id, current_user)
    
    plot_filename = f"{job_id}_rama.png"
    plot_path = os.path.join(PLOT_DIR, plot_filename)
    error_path = plot_path + ".error"
    stats_path = os.path.join(PLOT_DIR, f"{job_id}_stats.json")

    if os.path.exists(error_path):
        return {"status": "error", "detail": "Analysis failed — please try again"}

    if os.path.exists(plot_path):
        base_url = str(request.base_url).rstrip("/")

        # Read stats inline — eliminates the separate /stats race condition
        stats = {"total_residues": None, "allowed_percentage": None}
        if os.path.exists(stats_path):
            try:
                with open(stats_path) as f:
                    stats = json.load(f)
            except Exception:
                pass

        return {
            "status": "ready",
            "preview": f"{base_url}/analysis/preview/{plot_filename}",
            "download": f"{base_url}/analysis/download/{plot_filename}",
            "total_residues": stats.get("total_residues"),
            "allowed_percentage": stats.get("allowed_percentage"),
        }

    return {"status": "processing"}


# ================================================
# GET /analysis/stats/{job_id} — Get rama stats
# ================================================

@router.get("/stats/{job_id}")
def get_plot_stats(job_id: str, current_user: str = Depends(verify_token)):
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid job ID"
        )

    _verify_ownership(job_id, current_user)
    
    stats_path = os.path.join(PLOT_DIR, f"{job_id}_stats.json")

    if os.path.exists(stats_path):
        with open(stats_path) as f:
            return json.load(f)

    return {
        "total_residues": None,
        "allowed_percentage": None
    }


# ================================================
# Preview + Download (unchanged)
# ================================================

@router.get("/preview/{filename}")
def preview_plot(filename: str, current_user: str = Depends(verify_token)):
    if not re.fullmatch(r"[a-f0-9\-]+_rama\.png", filename):
        raise HTTPException(
            status_code=400,
            detail="Invalid filename"
        )

    job_id = filename[: -len("_rama.png")]
    _verify_ownership(job_id, current_user)
    file_path = os.path.join(PLOT_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return FileResponse(file_path, media_type="image/png")


@router.get("/download/{filename}")
def download_plot(filename: str, current_user: str = Depends(verify_token)):
    if not re.fullmatch(r"[a-f0-9\-]+_rama\.png", filename):
        raise HTTPException(
            status_code=400,
            detail="Invalid filename"
        )

    job_id = filename[: -len("_rama.png")]
    _verify_ownership(job_id, current_user)
    file_path = os.path.join(PLOT_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return FileResponse(
        path=file_path,
        media_type="image/png",
        filename=filename
    )