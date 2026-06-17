from fastapi import APIRouter, HTTPException, Depends,Request
from fastapi.responses import FileResponse,Response
from fastapi.background import BackgroundTasks
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.security import verify_token
from app.database import get_db
from app.models import ProteinCache
from app.main import limiter
import datetime as dt
import requests,re,uuid
import os
import random
import json

router = APIRouter(prefix="/protein", tags=["Protein"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RCSB_API_URL = "https://data.rcsb.org/rest/v1/core/entry/"
SEARCH_API   = "https://search.rcsb.org/rcsbsearch/v2/query"
CACHE_TTL_DAYS = 7

# ── Protein family keyword map ──────────────────────────────────────────────
FAMILY_MAP = {
    "HYDROLASE": "Hydrolase", "TRANSFERASE": "Transferase",
    "OXIDOREDUCTASE": "Oxidoreductase", "LYASE": "Lyase",
    "ISOMERASE": "Isomerase", "LIGASE": "Ligase",
    "IMMUNE": "Immune Protein", "ANTIBODY": "Antibody",
    "RECEPTOR": "Receptor", "HORMONE": "Hormone",
    "TRANSPORT": "Transport Protein", "STRUCTURAL": "Structural Protein",
    "MEMBRANE": "Membrane Protein", "VIRUS": "Viral Protein",
    "DNA": "DNA-binding Protein", "RNA": "RNA-binding Protein",
    "KINASE": "Kinase", "PROTEASE": "Protease",
    "CHAPERONE": "Chaperone", "SIGNALING": "Signaling Protein",
}

def classify_protein(keywords: str, title: str) -> dict:
    """Infer protein family from keywords/title."""
    text = ((keywords or "") + " " + (title or "")).upper()
    for key, label in FAMILY_MAP.items():
        if key in text:
            confidence = 95 if key in (keywords or "").upper() else 75
            return {"family": label, "confidence": confidence}
    return {"family": "Unclassified", "confidence": 0}

def aa_composition(sequences: list) -> dict:
    """Count amino acid residues across all chains."""
    AA_NAMES = {
        "A":"Ala","R":"Arg","N":"Asn","D":"Asp","C":"Cys",
        "E":"Glu","Q":"Gln","G":"Gly","H":"His","I":"Ile",
        "L":"Leu","K":"Lys","M":"Met","F":"Phe","P":"Pro",
        "S":"Ser","T":"Thr","W":"Trp","Y":"Tyr","V":"Val"
    }
    counts = {}
    total = 0
    for seq in sequences:
        for aa in seq.upper():
            if aa in AA_NAMES:
                counts[aa] = counts.get(aa, 0) + 1
                total += 1
    result = []
    for aa, cnt in sorted(counts.items(), key=lambda x: -x[1])[:10]:
        result.append({
            "code": aa,
            "name": AA_NAMES.get(aa, aa),
            "count": cnt,
            "percent": round(cnt / total * 100, 1) if total else 0
        })
    return {"composition": result, "total": total}

# ── Cache helper ─────────────────────────────────────────────────────────────
def get_cached_or_fetch(pdb_id: str, db: Session) -> dict:
    cached = db.query(ProteinCache).filter(ProteinCache.pdb_id == pdb_id).first()
    if cached and (datetime.utcnow() - cached.cached_at) < timedelta(days=CACHE_TTL_DAYS):
        return json.loads(cached.metadata_json)
    response = requests.get(f"{RCSB_API_URL}{pdb_id}", timeout=10)
    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Protein not found")
    data = response.json()
    if cached:
        cached.metadata_json = json.dumps(data)
        cached.cached_at = datetime.utcnow()
    else:
        db.add(ProteinCache(pdb_id=pdb_id, metadata_json=json.dumps(data), cached_at=datetime.utcnow()))
    db.commit()
    return data

# ── SEARCH ───────────────────────────────────────────────────────────────────
@router.get("/search/{query}")
@limiter.limit("10/minute")
def search_proteins(query: str, request: Request, current_user: str = Depends(verify_token)):
    """Search by full text — handles special chars like TNF-alpha."""
    # Try full-text first, fall back to structure title search
    payload = {
        "query": {
            "type": "terminal",
            "service": "full_text",
            "parameters": {"value": query}
        },
        "return_type": "entry",
        "request_options": {"paginate": {"start": 0, "rows": 20}}
    }
    try:
        response = requests.post(SEARCH_API, json=payload, timeout=12)
        # RCSB returns 204 when no results — not an error
        if response.status_code == 204:
            return []
        if response.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail="Search failed")
        data = response.json()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Search API error")

    results = []
    for item in data.get("result_set", []):
        pdb_id = item.get("identifier", "")
        if not pdb_id:
            continue
        pid = pdb_id.lower()
        results.append({
            "pdb_id": pdb_id.upper(),
            "image": f"https://cdn.rcsb.org/images/structures/{pid[1:3]}/{pid}/{pid}_assembly-1.jpeg",
            "viewer": f"https://www.rcsb.org/3d-view/{pid}"
        })
    return results

# ── PROTEIN OF THE DAY ───────────────────────────────────────────────────────
@router.get("/protein-of-the-day")
@limiter.limit("20/minute")
def protein_of_the_day(request: Request, db: Session = Depends(get_db), current_user: str = Depends(verify_token)):
    sample_ids = ["1CRN","4HHB","1BNA","2DN2","3J3Q","6VXX","1MBN","2PTC","1A3N","3HMX"]
    rng = random.Random(dt.date.today().toordinal())
    pdb_id = rng.choice(sample_ids)
    try:
        data = get_cached_or_fetch(pdb_id.lower(), db)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch protein")

    title    = data.get("struct", {}).get("title", "Unknown Protein")
    organism = "Unknown organism"
    try:
        organism = data["rcsb_entity_source_organism"][0]["scientific_name"]
    except Exception:
        pass

    pid = pdb_id.lower()
    return {
        "protein_name": title.split()[0].capitalize(),
        "pdb_id": pdb_id.upper(),
        "title": title,
        "organism": organism,
        "description": title,
        "image": f"https://cdn.rcsb.org/images/structures/{pid[1:3]}/{pid}/{pid}_assembly-1.jpeg",
        "viewer": f"https://www.rcsb.org/3d-view/{pid}",
        "fact": random.choice([
            "Proteins fold into specific structures driven by chemical interactions between amino acids.",
            "The Ramachandran plot is used to analyze allowed backbone angles in protein structures.",
            "AlphaFold can predict protein structures with remarkable accuracy using AI.",
            "Hemoglobin transports oxygen throughout the body using iron-containing heme groups.",
            "Enzymes speed up chemical reactions by lowering the activation energy required.",
            "Collagen is the most abundant protein in the human body.",
            "Antibodies are Y-shaped proteins that recognise and neutralise pathogens.",
            "Chaperone proteins assist newly synthesized proteins to fold correctly.",
            "Misfolded proteins are linked to diseases like Alzheimer's and Parkinson's.",
            "The Protein Data Bank contains over 220,000 experimentally determined structures.",
        ])
    }

# ── PROTEIN DETAILS ──────────────────────────────────────────────────────────
@router.get("/{pdb_id}")
@limiter.limit("20/minute")
def get_protein_data(pdb_id: str, request: Request, db: Session = Depends(get_db), current_user: str = Depends(verify_token)):
    pdb_id = pdb_id.lower()
    if not re.fullmatch(r"[a-z0-9]{4}", pdb_id):
        raise HTTPException(status_code=400, detail="Invalid PDB ID format")

    metadata = get_cached_or_fetch(pdb_id, db)

    resolution = metadata.get("rcsb_entry_info", {}).get("resolution_combined")
    if isinstance(resolution, list):
        resolution = resolution[0]

    header_information = {
        "title": metadata.get("struct", {}).get("title", "N/A"),
        "authors": metadata.get("audit_author", []),
        "citation": metadata.get("citation", []),
        "deposition_date": metadata.get("rcsb_accession_info", {}).get("deposit_date")
    }
    experimental_details = {
        "experimental_method": metadata.get("exptl", [{}])[0].get("method", "N/A"),
        "resolution": resolution,
        "r_work": metadata.get("refine", [{}])[0].get("ls_R_factor_R_work"),
        "r_free": metadata.get("refine", [{}])[0].get("ls_R_factor_R_free")
    }
    atomic_coordinates = {
        "atom_count": metadata.get("rcsb_entry_info", {}).get("deposited_atom_count"),
        "model_count": metadata.get("rcsb_entry_info", {}).get("deposited_model_count")
    }
    structural_annotation = {
        "polymer_entity_count": metadata.get("rcsb_entry_info", {}).get("polymer_entity_count"),
        "experimental_method": metadata.get("exptl", [{}])[0].get("method")
    }
    quality_metrics = {
        "resolution": resolution,
        "r_work": metadata.get("refine", [{}])[0].get("ls_R_factor_R_work"),
        "r_free": metadata.get("refine", [{}])[0].get("ls_R_factor_R_free"),
        "deposited_atom_count": metadata.get("rcsb_entry_info", {}).get("deposited_atom_count"),
        "deposited_residue_count": metadata.get("rcsb_entry_info", {}).get("deposited_polymer_monomer_count")
    }

    # ── Sequences ──
    sequence_information = {"sequences": []}
    entity_count = metadata.get("rcsb_entry_info", {}).get("polymer_entity_count", 0)
    for entity_id in range(1, entity_count + 1):
        try:
            sr = requests.get(
                f"https://data.rcsb.org/rest/v1/core/polymer_entity/{pdb_id}/{entity_id}",
                timeout=8
            )
            if sr.status_code == 200:
                sd = sr.json()
                seq = sd.get("entity_poly", {}).get("pdbx_seq_one_letter_code_can")
                if seq:
                    sequence_information["sequences"].append(seq)
        except Exception:
            pass

    # ── Molecular components ──
    molecular_components = []
    for entity in metadata.get("nonpolymer_entities", []):
        molecular_components.append({
            "component_name": entity.get("pdbx_entity_nonpoly", {}).get("name"),
            "component_type": entity.get("pdbx_entity_nonpoly", {}).get("comp_id")
        })

    # ── Organism ──
    organism = "N/A"
    common_name = None
    try:
        org = metadata["rcsb_entity_source_organism"][0]
        organism    = org.get("scientific_name", "N/A")
        common_name = org.get("common_name")
    except Exception:
        pass

    keywords = metadata.get("struct_keywords", {}).get("pdbx_keywords", "N/A")

    # ── Enhanced metadata (all agreed fields) ──
    enhanced_metadata = {
        "molecular_weight":    metadata.get("rcsb_entry_info", {}).get("molecular_weight"),
        "polymer_composition": metadata.get("rcsb_entry_info", {}).get("polymer_composition"),
        "entity_types":        metadata.get("rcsb_entry_info", {}).get("selected_polymer_entity_types"),
        "keywords":            keywords,
        "space_group":         metadata.get("symmetry", {}).get("space_group_name_hm"),
        "solvent_content":     None,
        # citation fields
        "citation_title":      None,
        "citation_doi":        None,
        "citation_journal":    None,
        # cell dimensions
        "cell_a": None, "cell_b": None, "cell_c": None,
        # organism description
        "protein_description": None,
    }
    try:
        enhanced_metadata["solvent_content"] = metadata["exptl_crystal"][0].get("density_percent_sol")
    except Exception:
        pass
    try:
        cit = metadata["citation"][0]
        enhanced_metadata["citation_title"]   = cit.get("title")
        enhanced_metadata["citation_doi"]     = cit.get("pdbx_database_id_doi")
        enhanced_metadata["citation_journal"] = cit.get("rcsb_journal_abbrev") or cit.get("journal_abbrev")
    except Exception:
        pass
    try:
        cell = metadata["cell"]
        enhanced_metadata["cell_a"] = cell.get("length_a")
        enhanced_metadata["cell_b"] = cell.get("length_b")
        enhanced_metadata["cell_c"] = cell.get("length_c")
    except Exception:
        pass

    # ── Amino acid composition ──
    aa_comp = aa_composition(sequence_information["sequences"])

    # ── Protein family classification ──
    protein_family = classify_protein(keywords, header_information["title"])

    # ── Quality score (0-100) ──
    quality_score = None
    if resolution is not None:
        try:
            r = float(resolution)
            # Scale: ≤1Å=100, 4Å=0
            quality_score = max(0, min(100, round((4 - r) / 3 * 100)))
        except Exception:
            pass

    static_image = f"https://cdn.rcsb.org/images/structures/{pdb_id[1:3]}/{pdb_id}/{pdb_id}_assembly-1.jpeg"
    viewer_url   = f"https://www.rcsb.org/3d-view/{pdb_id}"

    return {
        "pdb_id": pdb_id.upper(),
        "classification": keywords,
        "organism": organism,
        "common_name": common_name,
        "header_information":   header_information,
        "experimental_details": experimental_details,
        "sequence_information": sequence_information,
        "atomic_coordinates":   atomic_coordinates,
        "molecular_components": molecular_components,
        "structural_annotation":structural_annotation,
        "quality_metrics":      quality_metrics,
        "enhanced_metadata":    enhanced_metadata,
        "aa_composition":       aa_comp,
        "protein_family":       protein_family,
        "quality_score":        quality_score,
        "static_image": static_image,
        "viewer_url":   viewer_url,
    }

# ── DOWNLOAD PDB ─────────────────────────────────────────────────────────────
@router.get("/download/{pdb_id}")
def download_pdb(pdb_id: str, background_tasks: BackgroundTasks, current_user: str = Depends(verify_token)):
    pdb_id = pdb_id.lower()
    if not re.fullmatch(r"[a-z0-9]{4}", pdb_id):
        raise HTTPException(status_code=400, detail="Invalid PDB ID format")
    response = requests.get(f"https://files.rcsb.org/download/{pdb_id}.pdb", timeout=15)
    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="PDB file not found")
    temp_dir = os.path.join(BASE_DIR, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    unique_name = f"{pdb_id}_{uuid.uuid4().hex}.pdb"
    temp_path = os.path.join(temp_dir, unique_name)
    with open(temp_path, "wb") as f:
        f.write(response.content)
    background_tasks.add_task(os.remove, temp_path)
    return FileResponse(path=temp_path, media_type="chemical/x-pdb", filename=f"{pdb_id}.pdb")
