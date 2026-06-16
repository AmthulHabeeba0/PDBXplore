import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE from "../config";
import "./Protein.css";

// Helper component for individual data rows
function InfoRow({ label, value }) {
  if (value === null || value === undefined || value === "N/A" || value === "") return null;
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}

// Helper component for layout sections
function Section({ title, children, accent }) {
  return (
    <div className={`detail-section glass-card ${accent ? "detail-section--accent" : ""}`}>
      <h3 className="section-card-title">{title}</h3>
      {children}
    </div>
  );
}

// Sequence component with toggle logic
function SequenceBlock({ seq, index }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 120;
  const isLong = seq.length > LIMIT;
  const display = expanded ? seq : seq.slice(0, LIMIT);

  return (
    <div className="sequence-block">
      <span className="seq-label">Chain {index + 1}</span>
      <code className="seq-text">
        {display}{isLong && !expanded ? "…" : ""}
      </code>
      {isLong && (
        <button className="seq-toggle" onClick={() => setExpanded(p => !p)}>
          {expanded ? "Show less ▲" : "Show more ▼"}
        </button>
      )}
    </div>
  );
}

// Skeleton for the BODY ONLY (Header is handled in the main component now)
function SkeletonBody() {
  return (
    <div className="protein-layout">
      <div className="protein-left">
        <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
        <div className="skeleton" style={{ height: 48, borderRadius: 10, marginTop: 16 }} />
        <div className="skeleton" style={{ height: 100, borderRadius: 12, marginTop: 12 }} />
      </div>
      <div className="protein-right">
        {[200, 160, 180, 140].map((h, i) => (
          <div key={i} className="skeleton" style={{ height: h, borderRadius: 12, marginBottom: 16 }} />
        ))}
      </div>
    </div>
  );
}

function Protein() {
  const { pdb_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [protein, setProtein] = useState(null);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Reset state so loading UI triggers when moving between proteins
    setProtein(null);
    setError(false);

    const fetchProtein = async () => {
      try {
        const res = await fetch(`${API_BASE}/protein/${pdb_id}`);
        if (!res.ok) { setError(true); return; }
        const data = await res.json();
        setProtein(data);
      } catch {
        setError(true);
      }
    };
    fetchProtein();
  }, [pdb_id]);

  const handleDownload = async () => {
  if (!user) {
    navigate("/auth", { state: { from: location.pathname } });
    return;
  }
  setDownloading(true);
  try {
    const res = await fetch(`${API_BASE}/protein/download/${protein.pdb_id}`, {
      credentials: "include"
    });
    if (!res.ok) { alert("Download failed"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${protein.pdb_id}.pdb`; a.click();
    URL.revokeObjectURL(url);
  } finally {
    setDownloading(false);
  }
};

  // Error state remains a full-page replace
  if (error) return (
    <div className="protein-error">
      <span>⚠</span>
      <h2>Protein <strong>{pdb_id}</strong> not found</h2>
      <Link to="/explore"><button className="btn-cta">Browse Proteins</button></Link>
    </div>
  );

  // Map variables safely using Optional Chaining (?.) 
  // This prevents crashes while 'protein' is still null
  const hi = protein?.header_information || {};
  const ed = protein?.experimental_details || {};
  const ac = protein?.atomic_coordinates || {};
  const qm = protein?.quality_metrics || {};
  const sa = protein?.structural_annotation || {};
  const si = protein?.sequence_information || {};
  const mc = protein?.molecular_components || [];
  const em = protein?.enhanced_metadata || {};
  const authors = hi.authors || [];
  const citations = hi.citation || [];
  const sequences = si.sequences || [];
  const keywords = em.keywords ? em.keywords.split(",").map(k => k.trim()).filter(Boolean) : [];

  return (
    <div className="protein-page">
      <div className="container protein-container">

        {/* --- PERSISTENT HEADER: This will NOT disappear while loading --- */}
        <div className="protein-header fade-up">
          <div className="protein-id-badge">{pdb_id}</div>
          <div className="protein-title-block">
            <h1 className="protein-title">
              {protein ? (hi.title || protein.pdb_id) : `Loading ${pdb_id}...`}
            </h1>
            <div className="protein-tags">
              {protein ? (
                <>
                  {protein.classification && protein.classification !== "N/A" && (
                    <span className="badge">{protein.classification}</span>
                  )}
                  {protein.organism && protein.organism !== "N/A" && (
                    <span className="badge badge-green">{protein.organism}</span>
                  )}
                  {ed.experimental_method && ed.experimental_method !== "N/A" && (
                    <span className="badge badge-blue">{ed.experimental_method}</span>
                  )}
                </>
              ) : (
                /* Small tag placeholders while loading */
                <div className="skeleton" style={{ width: 120, height: 24, borderRadius: 4 }} />
              )}
            </div>
          </div>
        </div>

        {/* --- BODY AREA: Only this part swaps between Skeleton and Content --- */}
        {!protein ? (
          <SkeletonBody />
        ) : (
          <div className="protein-layout">
            
            {/* LEFT COLUMN */}
            <div className="protein-left">
              <div className="glass-card protein-visual">
                <img src={protein.static_image} alt={protein.pdb_id} />
                <div className="protein-visual-overlay" />
              </div>

              <div className="protein-actions">
                <a href={protein.viewer_url} target="_blank" rel="noreferrer" style={{ flex: 1 }}>
                  <button className="btn-cta" style={{ width: "100%", justifyContent: "center" }}>
                    ⬡ Open 3D Viewer
                  </button>
                </a>
                <button
                  className="btn-outline"
                  onClick={handleDownload}
                  disabled={downloading}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {downloading ? "…" : "↓ Download PDB"}
                </button>
              </div>

              <div className="quick-stats glass-card">
                {[
                  { val: qm.deposited_atom_count?.toLocaleString(), label: "Atoms" },
                  { val: qm.deposited_residue_count?.toLocaleString(), label: "Residues" },
                  { val: ed.resolution ? `${ed.resolution} Å` : null, label: "Resolution" },
                  { val: sa.polymer_entity_count, label: "Chains" },
                ].map(({ val, label }) => (
                  <div key={label} className="qs-item">
                    <span className="qs-value">{val ?? "—"}</span>
                    <span className="qs-label">{label}</span>
                  </div>
                ))}
              </div>

              {(em.molecular_weight || em.polymer_composition || em.space_group || em.solvent_content) && (
                <div className="glass-card enhanced-meta">
                  <h4 className="em-title">Molecular Info</h4>
                  {em.molecular_weight && (
                    <div className="info-row">
                      <span className="info-label">Mol. Weight</span>
                      <span className="info-value">{Number(em.molecular_weight).toLocaleString()} Da</span>
                    </div>
                  )}
                  {em.polymer_composition && (
                    <div className="info-row">
                      <span className="info-label">Composition</span>
                      <span className="info-value">{em.polymer_composition}</span>
                    </div>
                  )}
                  {em.space_group && (
                    <div className="info-row">
                      <span className="info-label">Space Group</span>
                      <span className="info-value">{em.space_group}</span>
                    </div>
                  )}
                  {em.solvent_content && (
                    <div className="info-row">
                      <span className="info-label">Solvent %</span>
                      <span className="info-value">{em.solvent_content}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="protein-right">
              <Section title="Basic Information">
                <InfoRow label="PDB ID" value={protein.pdb_id} />
                <InfoRow label="Classification" value={protein.classification} />
                <InfoRow label="Organism" value={protein.organism} />
                <InfoRow label="Common Name" value={protein.common_name} />
                <InfoRow label="Deposition Date" value={hi.deposition_date?.split("T")[0]} />
              </Section>

              <Section title="Experimental Details">
                <InfoRow label="Method" value={ed.experimental_method} />
                <InfoRow label="Resolution" value={ed.resolution ? `${ed.resolution} Å` : null} />
                <InfoRow label="R-work" value={ed.r_work} />
                <InfoRow label="R-free" value={ed.r_free} />
              </Section>

              <Section title="Structural Annotation">
                <InfoRow label="Polymer Chains" value={sa.polymer_entity_count} />
                <InfoRow label="Atom Count" value={ac.atom_count?.toLocaleString()} />
                <InfoRow label="Model Count" value={ac.model_count} />
                <InfoRow label="Deposited Residues" value={qm.deposited_residue_count?.toLocaleString()} />
              </Section>

              {keywords.length > 0 && (
                <Section title="Keywords">
                  <div className="keywords-grid">
                    {keywords.map((kw, i) => <span key={i} className="badge">{kw}</span>)}
                  </div>
                </Section>
              )}

              {sequences.length > 0 && (
                <Section title="Sequence Information">
                  {sequences.map((seq, i) => (
                    <SequenceBlock key={i} seq={seq} index={i} />
                  ))}
                </Section>
              )}

              {mc.length > 0 && (
                <Section title="Molecular Components">
                  <div className="components-grid">
                    {mc.map((comp, i) => (
                      <div key={i} className="comp-tag">
                        <span className="comp-name">{comp.component_name}</span>
                        <span className="comp-id badge badge-blue">{comp.component_type}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {authors.length > 0 && (
                <Section title="Authors">
                  <div className="authors-list">
                    {authors.map((a, i) => <span key={i} className="badge badge-blue">{a.name}</span>)}
                  </div>
                </Section>
              )}

              {citations.length > 0 && (
                <Section title="Publications">
                  {citations.slice(0, 3).map((cit, i) => (
                    <div key={i} className="citation-card">
                      <p className="cit-title">{cit.title}</p>
                      <div className="cit-meta">
                        {cit.rcsb_journal_abbrev && <span>{cit.rcsb_journal_abbrev}</span>}
                        {cit.year && <span>{cit.year}</span>}
                        {cit.pdbx_database_id_doi && (
                          <a href={`https://doi.org/${cit.pdbx_database_id_doi}`} target="_blank" rel="noreferrer" className="cit-doi">
                            DOI ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </Section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Protein;