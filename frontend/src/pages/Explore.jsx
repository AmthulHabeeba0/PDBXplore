import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API_BASE from "../config";
// CHANGE THIS PATH IF Search.jsx IS IN src/components/
import Search from "../components/Search";
import "./Explore.css";


function ProteinCardSkeleton() {
  return (
    <div className="pcard-skeleton glass-card">
      <div className="skeleton pcard-sk-img" />
      <div className="pcard-sk-body">
        <div className="skeleton pcard-sk-id" />
        <div className="skeleton pcard-sk-line" />
        <div className="skeleton pcard-sk-line2" />
      </div>
    </div>
  );
}

function ProteinCard({ pdb_id, image, title, organism, method }) {
  const [imgError, setImgError] = useState(false);
  const pid = pdb_id.toLowerCase();
  const hash = pid.substring(1, 3); 

  return (
    <Link to={`/protein/${pdb_id}`} className="pcard glass-card">
      <div className="pcard-img-container">
        {imgError ? (
          <div className="pcard-img-fallback"><span>⬡</span></div>
        ) : (
          <img
            src={image || `https://cdn.rcsb.org/images/structures/${hash}/${pid}/${pid}_assembly-1.jpeg`}
            alt={pdb_id}
            className="pcard-img-fit"
            onError={() => setImgError(true)}
          />
        )}
        <div className="pcard-overlay-gradient" />
        <span className="pcard-id-label">{pdb_id}</span>
      </div>

      <div className="pcard-body">
        <div className="pcard-mini-header">
           <span className="pcard-mini-id">{pdb_id}</span>
           <div className="pcard-meta">
              {organism && organism !== "N/A" && (
                <span className="pcard-meta-chip pcard-org">
                  {organism.split(' ')[0]}
                </span>
              )}
              {method && (
                <span className="pcard-meta-chip pcard-method">
                  {method.split(' ')[0]}
                </span>
              )}
           </div>
        </div>  
        <span className="pcard-cta-btn">Explore Structure →</span>
      </div>
    </Link>
  );
}

const TAXONOMY_FILTERS = [
  { label: "Human", query: "Homo sapiens" },
  { label: "Mouse", query: "Mus musculus" },
  { label: "Bacteria", query: "Bacteria" },
  { label: "Yeast", query: "Saccharomyces cerevisiae" },
];

const METHOD_FILTERS = [
  { label: "X-ray", query: "X-RAY DIFFRACTION" },
  { label: "NMR", query: "SOLUTION NMR" },
  { label: "Cryo-EM", query: "ELECTRON MICROSCOPY" },
];

export default function Explore() {
  const [query, setQuery] = useState("");
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  const fetchProteins = async (searchQuery) => {
    setLoading(true);
    try {
      // This handles "TNF-alpha" or any special characters safely
      const res = await fetch(`${API_BASE}/protein/search/${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setAllResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search Error:", err);
      setAllResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => { fetchProteins("protein"); }, []);

  const handleSearch = () => {
    if (!query.trim()) return;
    setActiveFilters([]); // Clear sidebar filters when doing a fresh text search
    fetchProteins(query.trim());
  };

  const toggleFilter = (label, queryTerm) => {
    const isActive = activeFilters.includes(label);
    if (isActive) {
      const next = activeFilters.filter(f => f !== label);
      setActiveFilters(next);
      fetchProteins(next.length === 0 ? "protein" : queryTerm);
    } else {
      setActiveFilters([label]); // Simple single-select logic
      fetchProteins(queryTerm);
    }
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setQuery("");
    fetchProteins("protein");
  };

  return (
    <div className="explore-page">
      <div className="container explore-container">
        <div className="explore-header fade-up">
          <span className="section-label">Database</span>
          <h1 className="section-title">Explore Proteins</h1>
          <p className="section-sub">
            Search and browse thousands of protein structures from the RCSB Protein Data Bank.
          </p>
        </div>

        <div className="explore-search-bar fade-up">
          <Search 
            isHero={true} 
            value={query} 
            placeholder="Search protein name or keyword..." 
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn-cta" onClick={handleSearch}>Search →</button>
        </div>

        <div className="explore-body fade-up">
          <aside className="explore-sidebar">
            <div className="sidebar-section">
              <h4 className="sidebar-heading">Taxonomy</h4>
              {TAXONOMY_FILTERS.map(({ label, query: q }) => (
                <label key={label} className="filter-row">
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={activeFilters.includes(label)}
                    onChange={() => toggleFilter(label, q)}
                  />
                  <span className="filter-label">{label}</span>
                </label>
              ))}
            </div>

            <div className="sidebar-section">
              <h4 className="sidebar-heading">Method</h4>
              {METHOD_FILTERS.map(({ label, query: q }) => (
                <label key={label} className="filter-row">
                  <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={activeFilters.includes(label)}
                    onChange={() => toggleFilter(label, q)}
                  />
                  <span className="filter-label">{label}</span>
                </label>
              ))}
            </div>

            {activeFilters.length > 0 && (
              <button className="filter-clear-btn" onClick={clearFilters}>
                ✕ Clear Filters
              </button>
            )}
          </aside>

          <div className="explore-results">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProteinCardSkeleton key={i} />)
              : allResults.map(p => (
                <ProteinCard
                  key={p.pdb_id}
                  pdb_id={p.pdb_id}
                  image={p.image}
                  title={p.title}
                  organism={p.organism}
                  method={p.method}
                />
              ))
            }
            {!loading && allResults.length === 0 && (
              <div className="explore-empty">
                <span style={{fontSize: '3rem'}}>🔬</span>
                <p>No results found. Try a different search term.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}