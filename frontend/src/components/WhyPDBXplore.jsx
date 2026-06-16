import "./WhyPDBXplore.css";

const features = [
  {
    icon: "🧬",
    title: "Ramachandran Analysis",
    desc: "Upload any PDB file and instantly validate protein backbone conformation with publication-quality plots.",
    badge: "Core Feature"
  },
  {
    icon: "⬡",
    title: "Interactive 3D Viewer",
    desc: "Visualize protein structures in 3D directly in your browser — rotate, zoom, and color by chain.",
    badge: "Visualization"
  },
  {
    icon: "🔬",
    title: "RCSB Integration",
    desc: "Access over 220,000 protein structures from the Protein Data Bank with rich metadata and search.",
    badge: "Database"
  },
  {
    icon: "📊",
    title: "Structure Metadata",
    desc: "Molecular weight, space group, organism, publications with DOI links — all in one clean panel.",
    badge: "Analytics"
  },
  {
    icon: "⚡",
    title: "Fast & Cached",
    desc: "Smart caching means protein data loads instantly after the first fetch — no waiting around.",
    badge: "Performance"
  },
  {
    icon: "🔒",
    title: "Secure Auth",
    desc: "JWT + OTP email verification — your account and analysis history stay protected.",
    badge: "Security"
  },
];

function WhyPDBXplore() {
  return (
    <section className="why-section section">
      <div className="container">
        <div className="why-header fade-up">
          <span className="section-label">Why PDBXplore</span>
          <h2 className="section-title">Everything you need for<br />protein exploration</h2>
          <p className="section-sub">
            A full-stack bioinformatics platform built for researchers, students,
            and anyone curious about the molecular machinery of life.
          </p>
        </div>

        <div className="why-grid">
          {features.map(({ icon, title, desc, badge }, i) => (
            <div
              key={title}
              className="why-card glass-card fade-up"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="why-icon">{icon}</div>
              <div className="why-body">
                <div className="why-badge-wrap">
                  <span className="badge">{badge}</span>
                </div>
                <h3 className="why-title">{title}</h3>
                <p className="why-desc">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyPDBXplore;
