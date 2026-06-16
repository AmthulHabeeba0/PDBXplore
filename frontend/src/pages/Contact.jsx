import { useState } from "react";
import API_BASE from "../config";
import "./Contact.css";

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null); // "success" | "error" | null
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      setStatus("fill");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="container contact-container">

        <div className="contact-left fade-up">
          <span className="section-label">Contact</span>
          <h1 className="section-title">Get in touch</h1>
          <p className="section-sub">
            Have a question, suggestion, or want to collaborate?
            We'd love to hear from you.
          </p>
          <div className="contact-info">
            <div className="contact-info-item">
              <span className="ci-icon">📬</span>
              <div>
                <div className="ci-label">Built with</div>
                <div className="ci-val">FastAPI · React · BioPython</div>
              </div>
            </div>
            <div className="contact-info-item">
              <span className="ci-icon">🗄️</span>
              <div>
                <div className="ci-label">Data source</div>
                <div className="ci-val">RCSB Protein Data Bank</div>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-right fade-up">
          <div className="glass-card contact-form">
            {status === "success" && (
              <div className="auth-success">✓ Message sent successfully! We'll get back to you soon.</div>
            )}
            {status === "error" && (
              <div className="auth-error">⚠ Something went wrong. Please try again.</div>
            )}
            {status === "fill" && (
              <div className="auth-error">⚠ Please fill in all fields.</div>
            )}

            <div className="contact-fields">
              <div className="auth-field-group">
                <label className="auth-label">Name</label>
                <input className="input-field" name="name" placeholder="Your name" value={form.name} onChange={handleChange} />
              </div>
              <div className="auth-field-group">
                <label className="auth-label">Email</label>
                <input className="input-field" name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} />
              </div>
              <div className="auth-field-group">
                <label className="auth-label">Message</label>
                <textarea
                  className="input-field contact-textarea"
                  name="message"
                  placeholder="Your message..."
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                />
              </div>
            </div>

            <button className="btn-cta contact-submit" onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className="auth-spinner" /> Sending...</> : "Send Message →"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Contact;
