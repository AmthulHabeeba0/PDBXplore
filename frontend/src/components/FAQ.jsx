import { useState } from "react";
import "./FAQ.css";

const faqs = [
  { q: "What file formats does PDBXplore support?", a: "PDBXplore supports .pdb and .ent file formats for Ramachandran analysis. These are standard formats used by the RCSB Protein Data Bank." },
  { q: "Do I need an account to use PDBXplore?", a: "You can browse and explore proteins without an account. An account is required to upload PDB files and generate Ramachandran plots." },
  { q: "How accurate is the Ramachandran analysis?", a: "Our analysis uses BioPython to calculate phi/psi angles and classifies residues into favoured and outlier regions based on standard stereochemical criteria." },
  { q: "Where does the protein data come from?", a: "All structural data is fetched directly from the RCSB Protein Data Bank — the world's largest repository of 3D macromolecular structure data with over 220,000 entries." },
  { q: "Can I download the PDB files?", a: "Yes — logged-in users can download PDB files for any structure. The files are fetched directly from RCSB and served via PDBXplore." },
];

function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="faq-section section">
      <div className="container faq-container">
        <div className="faq-header fade-up">
          <span className="section-label">FAQ</span>
          <h2 className="section-title">Frequently asked<br />questions</h2>
        </div>

        <div className="faq-list fade-up">
          {faqs.map(({ q, a }, i) => (
            <div
              key={i}
              className={`faq-item glass-card ${open === i ? "faq-item--open" : ""}`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="faq-q">
                <span>{q}</span>
                <span className="faq-icon">{open === i ? "−" : "+"}</span>
              </div>
              {open === i && <p className="faq-a">{a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
