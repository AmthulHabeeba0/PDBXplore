PDBXplore

PDBXplore is a full-stack bioinformatics platform designed for exploring protein structures from the RCSB Protein Data Bank and performing structural validation using Ramachandran plot analysis.

The platform integrates protein structural data retrieval, molecular visualization, and structural quality analysis into a unified web application.

It allows users to search proteins, view structural metadata, visualize 3D molecular structures, download PDB files, and perform backbone conformational analysis through Ramachandran plots.


Key Features

Protein Exploration
- Search proteins from the RCSB Protein Data Bank
- Retrieve structural metadata including:
  - Title
  - Authors
  - Organism
  - Experimental method
  - Resolution
  - Structural classification
- View static structure previews
- Integrated 3D molecular viewer

Structural Analysis
- Upload PDB / ENT protein structure files
- Automatic phi (φ) and psi (ψ) backbone angle calculation
- Ramachandran plot generation
- Structural validation statistics

Authentication & Security
- User registration and login
- JWT based authentication
- Email OTP verification
- Protected routes for sensitive operations

Data Access
- Secure PDB file download
- Ramachandran plot preview and export
- API-based protein metadata retrieval

Educational Features
- Protein of the Day (random protein discovery)
- BioBytes: rotating protein science facts


Tech Stack
Backend
- Python (3.14)
- FastAPI
- Uvicorn
- SQLAlchemy
- PyODBC
- python-dotenv
- Pydantic
- BioPython
- NumPy
- Matplotlib

Database System
Microsoft SQL Server (Express Edition)

Database Management Tool
SQL Server Management Studio (SSMS)

API Architecture
- RESTful architecture
- JSON communication
- OpenAPI documentation (auto-generated via FastAPI)


Frontend Stack
- React.js
- Axios
- React Router
- Tailwind CSS (or Bootstrap)
- Vite (Build Tool)


External Data Source

RCSB Protein Data Bank API
Used for:
- Protein metadata retrieval
- Structural data access
- Protein search queries
- Structure visualization resources

Development Tools

- Visual Studio Code
- Python Virtual Environment (venv)
- Windows OS
- Git & GitHub