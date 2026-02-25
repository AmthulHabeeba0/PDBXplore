from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from starlette.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..security import verify_token
import os
from ..rama import generate_ramachandran_plot
from fastapi.responses import FileResponse



router = APIRouter(
    prefix="/analysis",
    tags=["analysis"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
PLOT_DIR = os.path.join(BASE_DIR, "plots")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PLOT_DIR, exist_ok=True)


@router.post("/upload")
def upload_pdb(
    file: UploadFile = File(...),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db),
):
    # Validate
    if not file.filename.endswith((".pdb", ".ent")):
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Save file
    save_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(save_path, "wb") as f:
        f.write(file.file.read())

    return {"message": "File uploaded", "path": save_path}


@router.post("/rama")
def generate_rama(
    filename: str,
    current_user: str = Depends(verify_token)
):

    pdb_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(pdb_path):
        raise HTTPException(status_code=404, detail="File not found")
    if not filename.endswith((".pdb", ".ent")):
        raise HTTPException(
        status_code=400,
        detail="Only .pdb or .ent structure files allowed"
    )


    name = os.path.splitext(filename)[0]
    output_filename = f"{name}_rama.png"
    plot_path = os.path.join(PLOT_DIR, output_filename)

    stats = generate_ramachandran_plot(pdb_path, plot_path)

    return {
        "message": "Ramachandran plot generated successfully",
        "statistics": {
            "total_residues": stats["total_residues"],
            "allowed_percentage": stats["allowed_percentage"]
        },
        "preview": f"http://127.0.0.1:8000/analysis/preview/{output_filename}",
        "download": f"http://127.0.0.1:8000/analysis/download/{output_filename}"
    }


    
@router.get("/preview/{filename}")
def preview_plot(filename: str):
    file_path = os.path.join("app/plots", filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        file_path,
        media_type="image/png"
    )
    
@router.get("/download/{filename}")
def download_plot(filename: str):

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    plot_dir = os.path.join(BASE_DIR, "plots")

    file_path = os.path.join(plot_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        media_type="image/png",
        filename=filename
    )



