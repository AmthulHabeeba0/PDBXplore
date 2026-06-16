import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE from "../config";
import "./BioBytes.css";

function BioBytesSkeleton() {
  return (
    <div className="biobytes-skeleton">
      <div className="skeleton bb-sk-img" />
      <div className="bb-sk-body">
        <div className="skeleton bb-sk-label" />
        <div className="skeleton bb-sk-title" />
        <div className="skeleton bb-sk-line" />
        <div className="skeleton bb-sk-line short" />
        <div className="skeleton bb-sk-btn" />
      </div>
    </div>
  );
}

function BioBytes() {
  const [protein, setProtein] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProtein = async () => {
      try {
        const res = await fetch(`${API_BASE}/protein/protein-of-the-day`);
        const data = await res.json();
        setProtein(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProtein();
  }, []);

  return (
    <section className="biobytes-section section">
      <div className="container">
        <div className="section-label fade-up">Featured</div>
        <h2 className="section-title fade-up">BioBytes</h2>
        <p className="section-sub fade-up">
          Discover a protein of the day alongside curated facts from the world of structural biology.
        </p>

        <div className="biobytes-grid fade-up">
          {/* Protein of the Day */}
          <div className="glass-card biobytes-protein">
            <div className="bb-protein-label">
              <span className="badge">Protein of the Day</span>
            </div>

            {loading ? (
              <BioBytesSkeleton />
            ) : protein ? (
              <>
                <div className="bb-img-wrap">
                  <img src={protein.image} alt={protein.protein_name} className="bb-img" />
                  <div className="bb-img-overlay" />
                </div>
                <div className="bb-content">
                  <div className="bb-pdb-badge">{protein.pdb_id}</div>
                  <h3 className="bb-title">{protein.protein_name}</h3>
                  <div className="bb-meta">
                    <span className="bb-meta-item">
                      <span className="bb-meta-dot" /> {protein.organism}
                    </span>
                  </div>
                  <p className="bb-desc">{protein.description}</p>
                  <Link to={`/protein/${protein.pdb_id}`}>
                    <button className="btn-cta bb-btn">Explore Structure →</button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="bb-error">Failed to load protein of the day.</div>
            )}
          </div>

          {/* Did You Know */}
          <div className="glass-card biobytes-fact">
            <div className="bb-fact-icon">💡</div>
            <h3 className="bb-fact-title">Did You Know?</h3>
            {loading ? (
              <>
                <div className="skeleton bb-sk-line" style={{ marginBottom: 10 }} />
                <div className="skeleton bb-sk-line" style={{ marginBottom: 10 }} />
                <div className="skeleton bb-sk-line short" />
              </>
            ) : (
              <p className="bb-fact-text">{protein?.fact}</p>
            )}
            <div className="bb-fact-divider" />
            <div className="bb-fact-footer">
              <span className="badge badge-blue">Protein Biology</span>
              <span className="badge badge-green">Structural Science</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BioBytes;
