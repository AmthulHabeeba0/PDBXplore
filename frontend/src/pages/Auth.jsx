import { useState, useEffect, useRef } from "react";
import { loginUser, registerUser, verifyOTP } from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "./Auth.css";

// Mini canvas for the left panel
function AuthCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1
    }));
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.01;

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(165,190,0,0.4)";
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(66,122,161,${0.2 * (1 - d / 90)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Helix
      const cx = W / 2, amp = 30, turns = 3;
      for (let i = 0; i <= 80; i++) {
        const prog = i / 80;
        const y = H * 0.1 + prog * H * 0.8;
        const a1 = prog * Math.PI * 2 * turns + t;
        const x1 = cx + Math.sin(a1) * amp;
        const x2 = cx + Math.sin(a1 + Math.PI) * amp;
        ctx.beginPath(); ctx.arc(x1, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(5,102,141,${0.4 + 0.4 * Math.abs(Math.sin(a1))})`; ctx.fill();
        ctx.beginPath(); ctx.arc(x2, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165,190,0,${0.3 + 0.4 * Math.abs(Math.sin(a1))})`; ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="auth-canvas" />;
}

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const redirectTo = location.state?.from || "/";

  const [isLogin, setIsLogin] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ username: "", email: "", password: "", otp: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) { setError("Please fill all fields"); return; }
    try {
      setLoading(true); setError("");
      await registerUser(form.username, form.email, form.password);
      setSuccess("OTP sent to your email");
      setShowOTP(true);
    } catch (err) {
      setError(err?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (!form.otp) { setError("Please enter OTP"); return; }
    try {
      setLoading(true); setError("");
      await verifyOTP(form.email, form.otp);
      setSuccess("Email verified! Please log in.");
      setShowOTP(false); setIsLogin(true);
    } catch (err) {
      setError(err?.message || "OTP verification failed");
    } finally { setLoading(false); }
  };

  // ✅ LOGIN FIX: setUser immediately after token saved → no manual refresh needed
  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Please enter email and password"); return; }
    try {
      setLoading(true); setError("");
      const data = await loginUser(form.email, form.password);
    // No localStorage — cookie is set by the server automatically
      setUser({
        email: data.email,
        username: data.username
      });
      navigate(redirectTo);
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <AuthCanvas />
        <div className="auth-left-content">
          <div className="auth-brand">
            <span className="auth-brand-icon">⬡</span>
            <span className="auth-brand-name">PDBXplore</span>
          </div>
          <h2 className="auth-left-title">
            Structural biology<br />at your fingertips
          </h2>
          <p className="auth-left-sub">
            Access 220,000+ protein structures, run Ramachandran analysis,
            and explore the molecular world — all in one platform.
          </p>
          <div className="auth-left-tags">
            {["Ramaplot Analysis", "3D Viewer", "RCSB Integration", "Protein Classification"].map(t => (
              <span key={t} className="badge">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-card glass-card">

          {!showOTP && (
            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? "auth-tab--active" : ""}`}
                onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
              >Login</button>
              <button
                className={`auth-tab ${!isLogin ? "auth-tab--active" : ""}`}
                onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
              >Sign Up</button>
            </div>
          )}

          {showOTP && (
            <div className="auth-form-header">
              <h2>Verify your email</h2>
              <p>We sent a code to <strong>{form.email}</strong></p>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <div className="auth-fields">
            {!showOTP && !isLogin && (
              <div className="auth-field-group">
                <label className="auth-label">Username</label>
                <input
                  className="input-field"
                  name="username"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={handleChange}
                />
              </div>
            )}

            {!showOTP && (
              <>
                <div className="auth-field-group">
                  <label className="auth-label">Email</label>
                  <input
                    className="input-field"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="auth-field-group">
                  <label className="auth-label">Password</label>
                  <div className="auth-password-wrap">
                    <input
                      className="input-field"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={form.password}
                      onChange={handleChange}
                      onKeyDown={e => e.key === "Enter" && isLogin && handleLogin()}
                    />
                    <button
                      className="auth-eye"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {showOTP && (
              <div className="auth-field-group">
                <label className="auth-label">OTP Code</label>
                <input
                  className="input-field auth-otp-input"
                  name="otp"
                  placeholder="Enter 6-digit code"
                  value={form.otp}
                  onChange={handleChange}
                  maxLength={6}
                />
              </div>
            )}
          </div>

          {!showOTP && isLogin && (
            <button className="btn-cta auth-submit" onClick={handleLogin} disabled={loading}>
              {loading ? <span className="auth-spinner" /> : null}
              {loading ? "Logging in..." : "Login →"}
            </button>
          )}
          {!showOTP && !isLogin && (
            <button className="btn-cta auth-submit" onClick={handleRegister} disabled={loading}>
              {loading ? <span className="auth-spinner" /> : null}
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          )}
          {showOTP && (
            <button className="btn-cta auth-submit" onClick={handleVerifyOTP} disabled={loading}>
              {loading ? "Verifying..." : "Verify Email →"}
            </button>
          )}

          {showOTP && (
            <button className="auth-back" onClick={() => setShowOTP(false)}>
              ← Back to sign up
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
