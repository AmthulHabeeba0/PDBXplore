import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import API_BASE from "../config";
import "./Analysis.css";

function Analysis() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); setError(null); setStats(null); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); setError(null); setStats(null); }
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  // =====================================================
  // GENERATE — async: upload then poll for status
  // =====================================================
  const handleGenerate = async () => {
  if (!file) { setError("Please select a PDB file first."); return; }

  setLoading(true); setError(null); setResult(null); setStats(null);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/analysis/rama`, {
      method: "POST",
      credentials: "include",
      body: formData
    });
    const data = await res.json();
    if (!res.ok) { setError(data.detail || "Upload failed."); setLoading(false); return; }

    const { job_id } = data;
    setLoading(false);
    setPolling(true);

    pollRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`${API_BASE}/analysis/status/${job_id}`, {
          credentials: "include"
        });
        const statusData = await statusRes.json();

        if (statusData.status === "ready") {
          clearInterval(pollRef.current);
          setPolling(false);

          const previewRes = await fetch(statusData.preview, {
            credentials: "include"
          });
          const previewBlob = await previewRes.blob();
          const previewUrl = URL.createObjectURL(previewBlob);

          setResult({ preview: previewUrl, download: statusData.download });
          setStats({
            total_residues: statusData.total_residues ?? null,
            allowed_percentage: statusData.allowed_percentage ?? null,
          });
        } else if (statusData.status === "error") {
          clearInterval(pollRef.current);
          setPolling(false);
          setError(statusData.detail || "Plot generation failed.");
        }
      } catch {
        clearInterval(pollRef.current);
        setPolling(false);
        setError("Something went wrong during processing.");
      }
    }, 2000);

  } catch (err) {
    setLoading(false);
    setError("Upload failed. Please try again.");
  }
};

  const handleDownload = async () => {
    if (!result?.download) return;
    const res = await fetch(result.download, { credentials: "include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ramachandran_plot.png"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (result?.preview) URL.revokeObjectURL(result.preview);
    setFile(null); setResult(null); setError(null); setStats(null);
    clearInterval(pollRef.current); setPolling(false); setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // NOT LOGGED IN
  if (!user) return (
    <div className="analysis-gate-wrap">
      <div className="analysis-gate glass-card">
        <div className="gate-icon">🔬</div>
        <h2>Ramachandran Analysis</h2>
        <p>Log in to upload PDB files and generate Ramachandran plots.</p>
        <Link to="/auth"><button className="btn-cta">Login / Sign Up</button></Link>
      </div>
    </div>
  );

  return (
    <div className="analysis-page">
      <div className="container">

        <div className="analysis-header fade-up">
          <span className="section-label">Structure Validation</span>
          <h1 className="section-title">Ramachandran Analysis</h1>
          <p className="section-sub">
            Upload a PDB or ENT file to generate a Ramachandran plot and
            validate protein backbone conformation angles.
          </p>
        </div>

        <div className="analysis-layout">

          {/* LEFT — UPLOAD */}
          <div className="analysis-left">
            <div className="glass-card upload-card">
              <h2>Upload Structure File</h2>

              <div
                className={`drop-zone ${dragging ? "drop-zone--drag" : ""} ${file ? "drop-zone--has-file" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdb,.ent"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                {file ? (
                  <div className="file-selected">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <div className="drop-prompt">
                    <div className="drop-icon-wrap">
                      <span className="drop-icon">↑</span>
                    </div>
                    <span className="drop-text">Drag & drop your PDB file</span>
                    <span className="drop-sub">or click to browse — .pdb and .ent supported</span>
                  </div>
                )}
              </div>

              {file && (
                <button className="reset-btn" onClick={handleReset}>✕ Remove file</button>
              )}

              <button
                className="btn-cta generate-btn"
                onClick={handleGenerate}
                disabled={loading || polling || !file}
              >
                {(loading || polling) ? (
                  <><span className="auth-spinner" /> {loading ? "Uploading..." : "Generating..."}</>
                ) : "Generate Ramachandran Plot"}
              </button>

              {error && <div className="analysis-error">⚠ {error}</div>}
            </div>

            {/* INFO CARD */}
            <div className="glass-card info-card">
              <h3>What is a Ramachandran Plot?</h3>
              <p>
                A Ramachandran plot visualizes the backbone dihedral angles
                (φ, ψ) of amino acid residues in a protein structure —
                used to assess stereochemical quality and model validity.
              </p>
              <div className="legend">
                <div className="legend-item">
                  <span className="legend-dot green" />
                  Favoured regions — low steric hindrance
                </div>
                <div className="legend-item">
                  <span className="legend-dot red" />
                  Outliers — high steric hindrance
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — RESULT */}
          <div className="analysis-right">
            {!result && !loading && !polling && (
              <div className="result-placeholder glass-card">
                <span className="placeholder-icon">📊</span>
                <p>Your Ramachandran plot will appear here after generation.</p>
              </div>
            )}

            {(loading || polling) && (
              <div className="glass-card result-loading">
                {/* Skeleton shimmer */}
                <div className="skeleton skeleton-plot" />
                <div className="skeleton-stats">
                  <div className="skeleton skeleton-stat-block" />
                  <div className="skeleton skeleton-stat-block" />
                </div>
                <p className="loading-label">
                  {loading ? "Uploading file..." : "Generating Ramachandran plot..."}
                </p>
              </div>
            )}

            {result && (
              <div className="glass-card result-card">
                <div className="result-header">
                  <h2>Plot Generated ✓</h2>
                  <button className="btn-outline download-plot-btn" onClick={handleDownload}>
                    ↓ Download PNG
                  </button>
                </div>
                <div className="plot-preview">
                  <img src={result.preview} alt="Ramachandran Plot" />
                </div>
                {stats && (
                  <div className="result-stats">
                    <div className="r-stat glass-card">
                      <span className="r-stat-value">{stats.total_residues ?? "—"}</span>
                      <span className="r-stat-label">Total Residues</span>
                    </div>
                    <div className="r-stat glass-card">
                      <span className="r-stat-value accent">{stats.allowed_percentage ?? "—"}%</span>
                      <span className="r-stat-label">Favoured Regions</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analysis;
