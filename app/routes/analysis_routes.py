from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..security import verify_token
from ..rama import generate_ramachandran_plot

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


# =====================================
# Upload + Generate Rama + Delete PDB
# =====================================

@router.post("/rama")
async def generate_rama_plot_api(
    file: UploadFile = File(...),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):

    filename = file.filename.lower()

    if not filename.endswith((".pdb", ".ent")):
        raise HTTPException(status_code=400, detail="Invalid file type")

    unique_id = str(uuid.uuid4())

    pdb_filename = f"{unique_id}.pdb"
    plot_filename = f"{unique_id}_rama.png"

    pdb_path = os.path.join(UPLOAD_DIR, pdb_filename)
    plot_path = os.path.join(PLOT_DIR, plot_filename)

    # Save uploaded file
    with open(pdb_path, "wb") as f:
        f.write(await file.read())

    try:
        # Generate plot
        stats = generate_ramachandran_plot(pdb_path, plot_path)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ramachandran generation failed: {str(e)}"
        )

    finally:
        # Delete uploaded file
        if os.path.exists(pdb_path):
            os.remove(pdb_path)

    return {
        "message": "Ramachandran plot generated successfully",
        "statistics": {
            "total_residues": stats["total_residues"],
            "allowed_percentage": stats["allowed_percentage"]
        },
        "preview": f"http://127.0.0.1:8000/analysis/preview/{plot_filename}",
        "download": f"http://127.0.0.1:8000/analysis/download/{plot_filename}"
    }


# =====================================
# Preview Plot
# =====================================

@router.get("/preview/{filename}")
def preview_plot(filename: str):

    file_path = os.path.join(PLOT_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        file_path,
        media_type="image/png"
    )


# =====================================
# Download Plot
# =====================================

@router.get("/download/{filename}")
def download_plot(filename: str):

    file_path = os.path.join(PLOT_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        media_type="image/png",
        filename=filename
    )