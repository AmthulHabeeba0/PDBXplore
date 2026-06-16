import { Link } from "react-router-dom";
import "./CTA.css";

export function CTA() {
  return (
    <section className="cta-section section">
      <div className="container">
        <div className="cta-card glass-card fade-up">
          <div className="cta-glow" />
          <span className="section-label">Get Started</span>
          <h2 className="cta-title">Ready to explore<br />the molecular world?</h2>
          <p className="cta-sub">
            Join researchers and students using PDBXplore to analyze protein
            structures, validate conformations, and discover structural biology insights.
          </p>
          <div className="cta-actions">
            <Link to="/auth">
              <button className="btn-cta cta-btn-primary">Start Exploring →</button>
            </Link>
            <Link to="/explore">
              <button className="btn-outline">Browse Proteins</button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
