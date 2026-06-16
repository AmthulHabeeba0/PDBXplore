import "./Vision.css";

function Vision() {
  return (
    <section className="vision-section section">
      <div className="container vision-inner">
        <div className="vision-left fade-up">
          <span className="section-label">Our Vision</span>
          <h2 className="section-title">Making structural biology<br />accessible to everyone</h2>
          <p className="section-sub">
            PDBXplore was built to bridge the gap between complex protein structure data
            and the researchers, students, and scientists who need it.
          </p>
          <div className="vision-points">
            {[
              { icon: "🌍", text: "Open access to 220,000+ protein structures" },
              { icon: "⚡", text: "Instant analysis with no setup required" },
              { icon: "🎓", text: "Designed for learning and research alike" },
            ].map(({ icon, text }) => (
              <div key={text} className="vision-point">
                <span className="vision-point-icon">{icon}</span>
                <span className="vision-point-text">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vision-right fade-up">
          <div className="vision-card glass-card">
            <div className="vc-stat">
              <span className="vc-num">220K+</span>
              <span className="vc-label">PDB Structures</span>
            </div>
            <div className="vc-divider" />
            <div className="vc-stat">
              <span className="vc-num">100%</span>
              <span className="vc-label">Open Access</span>
            </div>
            <div className="vc-divider" />
            <div className="vc-stat">
              <span className="vc-num">∞</span>
              <span className="vc-label">Analyses Possible</span>
            </div>
          </div>
          <div className="vision-glow" />
        </div>
      </div>
    </section>
  );
}

export default Vision;
