PDBXplore – PROJECT ROADMAP

Phase 0 – Infrastructure (Completed)
Core backend infrastructure setup.
- FastAPI backend initialization  
- Project folder architecture  
- SQLAlchemy database integration  
- Environment configuration (.env)  
- GitHub repository setup and version control  
- Dependency management using requirements.txt  


Phase 1 – Authentication & Security (Completed)
User authentication and secure API access.
Features implemented:
- User registration system  
- Password hashing for secure credential storage  
- JWT authentication system  
- Login endpoint with token generation  
- Protected routes using dependency-based authentication  
- Email OTP verification during registration  
- Email utility integration for sending verification codes  
- Access control for protected API endpoints  


Phase 2 – Protein Data Integration (Completed)
Integration with the RCSB Protein Data Bank API to retrieve protein structure data.
Features implemented:
- Fetch protein metadata from RCSB API  
- Retrieve structural information including:
  - Title
  - Authors
  - Classification
  - Organism
  - Deposition date
  - Experimental method
  - Resolution
- Extraction of structural quality metrics:
  - R-work
  - R-free
  - Atom count
  - Residue count
- Sequence retrieval for protein chains
- Static protein structure preview images
- External 3D molecular viewer integration using RCSB viewer  


Phase 3 – Protein Search System (Completed)
Allows users to discover proteins from the Protein Data Bank.
Features implemented:
- Search proteins by keyword or protein name  
- Integration with the **RCSB Search API**  
- Result pagination  
- Return protein IDs and preview images  
- Used by both the **Home page search bar** and **Explore Proteins page**  


Phase 4 – Structural Analysis Engine (Completed)
Backend implementation for protein structure validation.
Features implemented:
- Upload protein structure files (.pdb / .ent)  
- Parsing protein structures using BioPython  
- Computation of **phi (φ) and psi (ψ) backbone angles**  
- Ramachandran plot generation  
- Statistical analysis including:
  - Total residues analyzed
  - Allowed region percentage
- Automatic cleanup of temporary uploaded files after analysis  


Phase 5 – Protein Visualization & Exploration (Completed)
Enhanced exploration tools for protein structures.
Features implemented:
- Static structure preview images from RCSB  
- Integrated 3D protein viewer via RCSB  
- Protein metadata display endpoints  
- Protein classification retrieval  
- Structural annotation and quality metrics exposure through API 


Phase 6 – Educational Features (Completed)
Interactive educational elements for users.
Protein of the Day
- Displays a randomly selected protein
- Retrieves structure metadata from RCSB
BioBytes – Did You Know?
- Rotating scientific facts related to proteins and molecular biology
- Designed for educational engagement on the homepage  


Phase 7 – Data Download & Export (Completed)
Provides access to structural files and analysis outputs.
Features implemented:
- Secure PDB file download system  
- Ramachandran plot preview endpoint  
- Ramachandran plot download endpoint  
- Token-based access control for downloads  


Phase 8 – React Frontend (In Progress)

Frontend web application for user interaction.

Planned features:

Homepage
- Protein search bar
- Protein of the Day card
- BioBytes facts section

Explore Proteins Page
- Search results display
- Protein cards with images and metadata

Protein Details Page
- Static protein structure preview
- Embedded 3D viewer
- Structural metadata display
- Download options

Ramachandran Analysis Page
- Upload PDB file
- Generate Ramachandran plot
- Plot preview and download

Authentication Pages
- User registration
- Email OTP verification
- Login

Final System Architecture
Backend:
- FastAPI
- SQLAlchemy
- BioPython
- JWT Authentication
- RCSB PDB API

Frontend (Upcoming):
- React.js
- REST API integration
- Interactive visualization UI


Project Status:
Backend development is fully completed and stable.
Frontend development using React will implement the user interface and interact with the existing API endpoints.