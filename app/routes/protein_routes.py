from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
import requests
import os
from app.security import verify_token  # adjust if different import

router = APIRouter(
    prefix="/protein",
    tags=["Protein"]
)

# ==============================
# PUBLIC: Fetch Metadata
# ==============================

@router.get("/{pdb_id}")
def get_protein_data(pdb_id: str):

    pdb_id = pdb_id.lower()

    # Basic validation (PDB IDs are usually 4 characters)
    if len(pdb_id) != 4:
        raise HTTPException(status_code=400, detail="Invalid PDB ID format")

    metadata_url = f"https://data.rcsb.org/rest/v1/core/entry/{pdb_id}"

    response = requests.get(metadata_url)

    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Protein not found")

    data = response.json()

    title = data.get("struct", {}).get("title", "N/A")
    resolution = data.get("rcsb_entry_info", {}).get("resolution_combined", ["N/A"])[0]
    method = data.get("exptl", [{}])[0].get("method", "N/A")

    organism = "N/A"
    try:
        organism = data["rcsb_entity_source_organism"][0]["scientific_name"]
    except:
        pass

    static_image = f"https://cdn.rcsb.org/images/structures/{pdb_id[0:2]}/{pdb_id}/{pdb_id}_assembly-1.jpeg"
    viewer_url = f"https://www.rcsb.org/3d-view/{pdb_id}"

    return {
        "pdb_id": pdb_id.upper(),
        "title": title,
        "resolution": resolution,
        "method": method,
        "organism": organism,
        "static_image": static_image,
        "viewer_url": viewer_url
    }


# ==============================
# PROTECTED: Download PDB File
# ==============================

@router.get("/download/{pdb_id}")
def download_pdb(pdb_id: str, current_user: str = Depends(verify_token)):

    pdb_id = pdb_id.lower()

    if len(pdb_id) != 4:
        raise HTTPException(status_code=400, detail="Invalid PDB ID format")

    pdb_url = f"https://files.rcsb.org/download/{pdb_id}.pdb"

    response = requests.get(pdb_url)

    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="PDB file not found")

    # Save temporarily
    temp_dir = "app/temp"
    os.makedirs(temp_dir, exist_ok=True)

    temp_path = os.path.join(temp_dir, f"{pdb_id}.pdb")

    with open(temp_path, "wb") as f:
        f.write(response.content)

    return FileResponse(
        path=temp_path,
        media_type="chemical/x-pdb",
        filename=f"{pdb_id}.pdb"
    )
