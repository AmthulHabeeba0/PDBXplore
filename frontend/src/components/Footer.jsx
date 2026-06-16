import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        
        {/* Main Section: Brand + Links */}
        <div className="footer-main">
          
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-helix" style={{color: 'var(--accent)'}}>⬡</span>
              <span>PDBXplore</span>
            </div>
            <p className="footer-tagline">
              Advanced protein structure exploration powered by the RCSB Protein Data Bank.
            </p>
            <div className="footer-badges">
              <span className="badge">Bioinformatics</span>
              <span className="badge badge-blue">Structural Biology</span>
            </div>
          </div>

          <div className="footer-links-wrapper">
            <div className="footer-col">
              <h4>Platform</h4>
              <Link to="/">Home</Link>
              <Link to="/explore">Explore</Link>
              <Link to="/analysis">Analysis</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div className="footer-col">
              <h4>External</h4>
              <a href="https://www.rcsb.org" target="_blank" rel="noreferrer">RCSB PDB ↗</a>
              <a href="https://www.uniprot.org" target="_blank" rel="noreferrer">UniProt ↗</a>
            </div>
          </div>

        </div>

        {/* Simple Bottom Row */}
        <div className="footer-bottom">
          <p>© {currentYear} PDBXplore. All rights reserved.</p>
          <div className="footer-credit">
            Built for <a href="#0">Structural Biology Research</a>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;