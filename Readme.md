PDBXplore

A full-stack bioinformatics web application for exploring protein structures from the RCSB Protein Data Bank and performing structural validation through Ramachandran plot analysis.


Features-

Protein Exploration:
- Search 220,000+ proteins from the RCSB Protein Data Bank
- View structural metadata: title, authors, organism, experimental method, resolution, and classification
- Integrated 3D molecular viewer
- Static structure previews via RCSB CDN
- Protein of the Day — random protein discovery
- BioBytes — rotating protein science facts

Ramachandran Analysis:
- Upload PDB / ENT protein structure files (up to 10MB)
- Automatic φ/ψ backbone dihedral angle calculation via BioPython
- KDE density Ramachandran plot generation
- Structural validation statistics: favoured regions, allowed regions, outliers
- Authenticated plot preview and PNG download

Authentication & Security:
- User registration with email OTP verification
- Secure login with httpOnly cookie-based JWT authentication
- Rate limiting on all sensitive endpoints
- Protected routes for analysis and file access
- Per-user job ownership — plots are private to the uploading user

---

Tech Stack-

Backend:
| Technology                 | Purpose |
|----------------------------|----------------------------------|
| Python 3.11+               | Core language |
| FastAPI                    | REST API framework |
| SQLAlchemy                 | ORM / database access |
| Microsoft SQL Server       | Primary database |
| BioPython                  | PDB parsing and angle calculation |
| Matplotlib + NumPy + SciPy | Ramachandran plot generation |
| python-jose                | JWT creation and verification |
| passlib (bcrypt)           | Password hashing |
| slowapi                    | Rate limiting |
| python-dotenv              | Environment variable management |

Frontend:
| Technology   | Purpose |
|--------------|--------------|
| React.js     | UI framework |
| React Router | Client-side routing |
| Vite         | Build tool |
| CSS Modules  | Component styling |

External Data-
RCSB PDB API— protein metadata, search, structure previews, PDB file downloads



Project Structure-

PDBXplore/
├── app/
│   ├── routes/
│   │   ├── analysis_routes.py   # PDB upload, plot generation, job management
│   │   ├── auth_routes.py       # Register, OTP verify, login, logout
│   │   ├── protein_routes.py    # RCSB protein data endpoints
│   │   ├── user_routes.py       # User profile and account management
│   │   └── contact_routes.py   # Contact form
│   ├── uploads/                 # Temporary PDB file storage (gitignored)
│   ├── plots/                   # Generated Ramachandran plots (gitignored)
│   ├── main.py                  # FastAPI app, middleware, startup tasks
│   ├── models.py                # SQLAlchemy models
│   ├── schemas.py               # Pydantic validation schemas
│   ├── security.py              # JWT, password hashing, token verification
│   ├── rama.py                  # Ramachandran plot generation logic
│   ├── database.py              # Database connection
│   └── email_utils.py           # OTP email sending
├── frontend/
│   └── src/
│       ├── pages/               # Auth, Analysis, Protein, Settings, etc.
│       ├── context/             # AuthContext, ThemeContext
│       ├── services/            # API service functions
│       └── config.js            # Centralised API base URL
├── requirements.txt
└── .env                         # Environment variables (never committed)


Environment Variables-
Create a `.env` file in the project root:

env
SECRET_KEY=your-secret-key-here
DATABASE_URL=your-database-connection-string
EMAIL_ADDRESS=your-gmail-address
EMAIL_PASSWORD=your-gmail-app-password
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173


| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing key — use a long random string |
| `DATABASE_URL` | SQLAlchemy connection string for SQL Server |
| `EMAIL_ADDRESS` | Gmail address used to send OTP emails |
| `EMAIL_PASSWORD` | Gmail App Password (not your account password) |
| `ENVIRONMENT` | Set to `production` to disable Swagger and enforce secure cookies |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins |


Getting Started:

Backend-
bash:
#Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

#Install dependencies
pip install -r requirements.txt

#Run the development server
uvicorn app.main:app --reload
Backend runs at `http://127.0.0.1:8000`
API docs available at `http://127.0.0.1:8000/docs` (development only — disabled in production)

Frontend-
bash:
cd frontend
npm install
npm run dev
Frontend runs at `http://localhost:5173`

Security Notes-
- JWT tokens are stored in 'httpOnly' cookies — not accessible to JavaScript
- All file uploads are validated via BioPython before processing
- Generated plots are private — only accessible to the uploading user
- Swagger UI and OpenAPI schema are disabled in production
- Rate limiting applied to login, register, OTP verification, and file upload endpoints
- CORS origins are configurable via environment variable

Deployment-
Set the following in your production environment:
env:
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-frontend-domain.com

The backend requires a persistent server (Render, Railway, Fly.io, etc.) since it runs a Python process continuously. The frontend can be deployed as a static site after running 'npm run build'.



Author - 
Amtul Habeeba 