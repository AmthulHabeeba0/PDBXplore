import "./Workflow.css";

const steps = [
  { num: "01", title: "Search or Upload", desc: "Search the RCSB database by protein name or PDB ID, or upload your own .pdb file for analysis." },
  { num: "02", title: "Analyze Structure", desc: "Generate Ramachandran plots, view 3D structure, and inspect quality metrics — all in seconds." },
  { num: "03", title: "Explore Metadata", desc: "Dive deep into molecular weight, organism, publications, experimental details and more." },
  { num: "04", title: "Download Results", desc: "Export your Ramachandran plot as a high-resolution PNG or download the full PDB file." },
];

function Workflow() {
  return (
    <section className="workflow-section section">
      <div className="container">
        <div className="workflow-header fade-up">
          <span className="section-label">How It Works</span>
          <h2 className="section-title">From upload to insight<br />in four steps</h2>
        </div>

        <div className="workflow-steps">
          {steps.map(({ num, title, desc }, i) => (
            <div
              key={num}
              className="workflow-step fade-up"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="step-num">{num}</div>
              <div className="step-line" />
              <div className="glass-card step-card">
                <h3 className="step-title">{title}</h3>
                <p className="step-desc">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Workflow;
