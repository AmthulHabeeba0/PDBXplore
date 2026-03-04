from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
import requests
import os
import random
from app.security import verify_token

router = APIRouter(
    prefix="/protein",
    tags=["Protein"]
)

RCSB_API_URL = "https://data.rcsb.org/rest/v1/core/entry/"
SEARCH_API = "https://search.rcsb.org/rcsbsearch/v2/query"


# =====================================
# SEARCH PROTEINS
# =====================================

@router.get("/search/{query}")
def search_proteins(query: str):

    payload = {
        "query": {
            "type": "terminal",
            "service": "full_text",
            "parameters": {
                "value": query
            }
        },
        "return_type": "entry",
        "request_options": {
            "paginate": {
                "start": 0,
                "rows": 20
            }
        }
    }

    try:
        response = requests.post(SEARCH_API, json=payload)

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Search failed")

        data = response.json()

    except Exception:
        raise HTTPException(status_code=500, detail="Search API error")

    results = []

    for item in data.get("result_set", []):

        pdb_id = item.get("identifier")

        if not pdb_id:
            continue

        pdb_id = pdb_id.lower()

        results.append({
            "pdb_id": pdb_id.upper(),
            "image": f"https://cdn.rcsb.org/images/structures/{pdb_id[1:3]}/{pdb_id}/{pdb_id}_assembly-1.jpeg",
            "viewer": f"https://www.rcsb.org/3d-view/{pdb_id}"
        })

    return results


# =====================================
# PROTEIN OF THE DAY
# =====================================

@router.get("/protein-of-the-day")
def protein_of_the_day():
    sample_ids = [
        "1CRN","4HHB","1BNA","2DN2","3J3Q",
        "6VXX","1MBN","2PTC","1A3N","3HMX"
    ]

    pdb_id = random.choice(sample_ids)

    response = requests.get(f"{RCSB_API_URL}{pdb_id}")

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch protein")

    data = response.json()

# Protein title
    title = data.get("struct", {}).get("title", "Unknown Protein")

# Organism
    organism = "Unknown organism"
    try:
        organism = data["rcsb_entity_source_organism"][0]["scientific_name"]
    except:
        pass

# Protein short name
    protein_name = title.split()[0].capitalize()

# Static image
    image = f"https://cdn.rcsb.org/images/structures/{pdb_id.lower()[1:3]}/{pdb_id.lower()}/{pdb_id.lower()}_assembly-1.jpeg"

# 3D viewer
    viewer = f"https://www.rcsb.org/3d-view/{pdb_id.lower()}"

# Protein educational facts
    protein_facts = [

    "Proteins are polymers made of amino acids linked together by peptide bonds.",

    "The three-dimensional shape of a protein determines its biological function.",

    "Enzymes are specialized proteins that speed up chemical reactions in cells.",

    "Hemoglobin is a protein in red blood cells that transports oxygen throughout the body.",

    "Proteins fold into specific structures driven by chemical interactions between amino acids.",

    "Collagen is the most abundant protein in the human body and provides structural support to tissues.",

    "Antibodies are proteins produced by the immune system to recognize and neutralize pathogens.",

    "Insulin is a protein hormone that regulates blood glucose levels in the body.",

    "Proteins can act as enzymes, structural components, transporters, signaling molecules, or molecular machines.",

    "Some proteins form complexes with multiple subunits that work together to perform biological functions.",

    "Protein folding occurs naturally as the amino acid chain finds its lowest energy conformation.",

    "Misfolded proteins can lead to diseases such as Alzheimer's, Parkinson's, and prion diseases.",

    "The Protein Data Bank stores experimentally determined 3D structures of biological macromolecules.",

    "Proteins interact with DNA and RNA to control gene expression and cellular processes.",

    "Membrane proteins are embedded in cell membranes and help transport molecules across the membrane.",

    "Some proteins function as receptors that detect signals from the environment and trigger cellular responses.",

    "Motor proteins such as kinesin and dynein move along cellular structures to transport cargo inside cells.",

    "Proteins can undergo conformational changes that allow them to switch between active and inactive states.",

    "Many proteins require cofactors such as metal ions or small molecules to function properly.",

    "The Ramachandran plot is used to analyze allowed backbone angles in protein structures.",

    "Protein structures can be determined using X-ray crystallography, NMR spectroscopy, and cryo-electron microscopy.",

    "Alpha helices and beta sheets are common secondary structure elements found in proteins.",

    "Proteins can bind specifically to other molecules, forming complexes essential for biological regulation.",

    "Chaperone proteins assist newly synthesized proteins in folding correctly.",

    "Some proteins act as molecular scaffolds, organizing other proteins into functional complexes.",

    "Protein degradation is carried out by cellular systems such as the proteasome.",

    "Signal proteins help cells communicate with each other through biochemical pathways.",

    "Protein engineering allows scientists to design proteins with new functions.",

    "Artificial intelligence systems such as AlphaFold can predict protein structures with high accuracy.",

    "Studying protein structures helps scientists understand diseases and design new drugs."

    ]

    return {
        "protein_name": protein_name,
        "pdb_id": pdb_id,
        "title": title,
        "organism": organism,
        "description": title,
        "image": image,
        "viewer": viewer,
        "fact": random.choice(protein_facts)
    }



# =====================================
# PROTEIN DETAILS
# =====================================

@router.get("/{pdb_id}")
def get_protein_data(pdb_id: str):

    pdb_id = pdb_id.lower()

    if len(pdb_id) != 4:
        raise HTTPException(status_code=400, detail="Invalid PDB ID format")

    response = requests.get(f"{RCSB_API_URL}{pdb_id}")

    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Protein not found")

    metadata = response.json()

    resolution = metadata.get("rcsb_entry_info", {}).get("resolution_combined")

    if isinstance(resolution, list):
        resolution = resolution[0]

    # HEADER INFORMATION
    header_information = {
        "title": metadata.get("struct", {}).get("title", "N/A"),
        "authors": metadata.get("audit_author", []),
        "citation": metadata.get("citation", []),
        "deposition_date": metadata.get("rcsb_accession_info", {}).get("deposit_date")
    }

    # EXPERIMENTAL DETAILS
    experimental_details = {
        "experimental_method": metadata.get("exptl", [{}])[0].get("method", "N/A"),
        "resolution": resolution,
        "r_work": metadata.get("refine", [{}])[0].get("ls_R_factor_R_work"),
        "r_free": metadata.get("refine", [{}])[0].get("ls_R_factor_R_free")
    }

    # SEQUENCE INFORMATION
    sequence_information = {"sequences": []}

    entity_count = metadata.get("rcsb_entry_info", {}).get("polymer_entity_count", 0)

    for entity_id in range(1, entity_count + 1):

        seq_url = f"https://data.rcsb.org/rest/v1/core/polymer_entity/{pdb_id}/{entity_id}"

        try:
            seq_response = requests.get(seq_url)

            if seq_response.status_code == 200:
                seq_data = seq_response.json()

                sequence = seq_data.get("entity_poly", {}).get("pdbx_seq_one_letter_code_can")

                if sequence:
                    sequence_information["sequences"].append(sequence)

        except:
            pass

    # ATOMIC COORDINATES
    atomic_coordinates = {
        "atom_count": metadata.get("rcsb_entry_info", {}).get("deposited_atom_count"),
        "model_count": metadata.get("rcsb_entry_info", {}).get("deposited_model_count")
    }

    # MOLECULAR COMPONENTS
    molecular_components = []

    nonpoly_entities = metadata.get("nonpolymer_entities", [])

    for entity in nonpoly_entities:
        molecular_components.append({
            "component_name": entity.get("pdbx_entity_nonpoly", {}).get("name"),
            "component_type": entity.get("pdbx_entity_nonpoly", {}).get("comp_id")
        })

    # STRUCTURAL ANNOTATION
    structural_annotation = {
        "polymer_entity_count": metadata.get("rcsb_entry_info", {}).get("polymer_entity_count"),
        "experimental_method": metadata.get("exptl", [{}])[0].get("method")
    }

    # QUALITY METRICS
    quality_metrics = {
        "resolution": resolution,
        "r_work": metadata.get("refine", [{}])[0].get("ls_R_factor_R_work"),
        "r_free": metadata.get("refine", [{}])[0].get("ls_R_factor_R_free"),
        "deposited_atom_count": metadata.get("rcsb_entry_info", {}).get("deposited_atom_count"),
        "deposited_residue_count": metadata.get("rcsb_entry_info", {}).get("deposited_polymer_monomer_count")
    }

    organism = "N/A"

    try:
        organism = metadata["rcsb_entity_source_organism"][0]["scientific_name"]
    except:
        pass

    classification = metadata.get("struct_keywords", {}).get("pdbx_keywords", "N/A")

    static_image = f"https://cdn.rcsb.org/images/structures/{pdb_id[1:3]}/{pdb_id}/{pdb_id}_assembly-1.jpeg"

    viewer_url = f"https://www.rcsb.org/3d-view/{pdb_id}"

    return {
        "pdb_id": pdb_id.upper(),

        "classification": classification,
        "organism": organism,

        "header_information": header_information,
        "experimental_details": experimental_details,
        "sequence_information": sequence_information,
        "atomic_coordinates": atomic_coordinates,
        "molecular_components": molecular_components,
        "structural_annotation": structural_annotation,
        "quality_metrics": quality_metrics,

        "static_image": static_image,
        "viewer_url": viewer_url
    }


# =====================================
# DOWNLOAD PDB
# =====================================

@router.get("/download/{pdb_id}")
def download_pdb(pdb_id: str, current_user: str = Depends(verify_token)):

    pdb_id = pdb_id.lower()

    if len(pdb_id) != 4:
        raise HTTPException(status_code=400, detail="Invalid PDB ID format")

    pdb_url = f"https://files.rcsb.org/download/{pdb_id}.pdb"

    response = requests.get(pdb_url)

    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="PDB file not found")

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