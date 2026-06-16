import { Link } from "react-router-dom";
import "./About.css";

function About() {
  return (
    <div className="about-page">
      <div className="container">

        <div className="about-hero fade-up">
          <span className="section-label">About</span>
          <h1 className="section-title">Built for the curious<br />minds of biology</h1>
          <p className="about-sub">
            PDBXplore is a bioinformatics web application that makes protein structure
            data accessible, analyzable, and understandable — for students, researchers,
            and scientists worldwide.
          </p>
        </div>

        <div className="about-grid">
          {[
            {
              icon: "🧬",
              title: "What We Do",
              body: "We provide tools to explore the Protein Data Bank, generate Ramachandran plots for backbone conformation analysis, and visualize 3D molecular structures — all in one platform."
            },
            {
              icon: "⚙️",
              title: "How It's Built",
              body: "PDBXplore is powered by FastAPI on the backend with SQLAlchemy ORM, JWT authentication, and BioPython for structural analysis. The frontend is built with React and Vite."
            },
            {
              icon: "🌍",
              title: "Data Source",
              body: "All structural data comes directly from the RCSB Protein Data Bank — the world's largest repository of 3D macromolecular structure data with over 220,000 experimentally determined structures."
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="about-card glass-card fade-up">
              <span className="about-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>

        <div className="about-tech fade-up">
          <h3 className="about-tech-title">Tech Stack</h3>
          <div className="tech-grid">
            {[
              "FastAPI", "SQLAlchemy", "BioPython", "JWT Auth",
              "React", "Vite", "RCSB PDB API", "Python"
            ].map(tech => (
              <span key={tech} className="badge badge-blue tech-badge">{tech}</span>
            ))}
          </div>
        </div>

        <div className="about-cta fade-up">
          <Link to="/explore">
            <button className="btn-cta">Explore Proteins →</button>
          </Link>
          <Link to="/contact">
            <button className="btn-outline">Get in Touch</button>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default About;
