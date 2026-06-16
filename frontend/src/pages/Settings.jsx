import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import API_BASE from "../config";
import "./Settings.css";

function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [usernameMsg, setUsernameMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (!user) return (
    <div className="settings-gate">
      <div className="glass-card settings-gate-card">
        <span>🔒</span>
        <h2>Login Required</h2>
        <p>Please log in to access settings.</p>
        <Link to="/auth"><button className="btn-cta">Login</button></Link>
      </div>
    </div>
  );

  const updateUsername = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/update-username`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      setUsernameMsg({ ok: res.ok, text: data.message || data.detail });
    } catch {
      setUsernameMsg({ ok: false, text: "Update failed" });
    }
  };

  const updatePassword = async () => {
    if (!password) { setPasswordMsg({ ok: false, text: "Enter a new password" }); return; }
    try {
      const res = await fetch(`${API_BASE}/user/update-password`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      setPasswordMsg({ ok: res.ok, text: data.message || data.detail });
      if (res.ok) setPassword("");
    } catch {
      setPasswordMsg({ ok: false, text: "Update failed" });
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/user/delete`, {
        method: "DELETE",
        credentials: "include"
      });
      logout();
      navigate("/");
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="container settings-container">

        <div className="settings-header fade-up">
          <span className="section-label">Account</span>
          <h1 className="section-title">Settings</h1>
        </div>

        <div className="settings-grid">

          {/* Profile Info */}
          <div className="glass-card settings-card fade-up">
            <div className="settings-card-header">
              <div className="settings-avatar">{user.username.charAt(0).toUpperCase()}</div>
              <div>
                <div className="settings-username">{user.username}</div>
                <div className="settings-email">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Update Username */}
          <div className="glass-card settings-card fade-up">
            <h3 className="settings-card-title">Update Username</h3>
            <div className="settings-field">
              <label className="auth-label">New Username</label>
              <input
                className="input-field"
                value={username}
                onChange={e => { setUsername(e.target.value); setUsernameMsg(null); }}
                placeholder="Enter new username"
              />
            </div>
            {usernameMsg && (
              <div className={usernameMsg.ok ? "auth-success" : "auth-error"}>
                {usernameMsg.text}
              </div>
            )}
            <button className="btn-cta settings-btn" onClick={updateUsername}>
              Update Username
            </button>
          </div>

          {/* Update Password */}
          <div className="glass-card settings-card fade-up">
            <h3 className="settings-card-title">Update Password</h3>
            <div className="settings-field">
              <label className="auth-label">New Password</label>
              <input
                className="input-field"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setPasswordMsg(null); }}
                placeholder="Enter new password"
              />
            </div>
            {passwordMsg && (
              <div className={passwordMsg.ok ? "auth-success" : "auth-error"}>
                {passwordMsg.text}
              </div>
            )}
            <button className="btn-cta settings-btn" onClick={updatePassword}>
              Update Password
            </button>
          </div>

          {/* Danger Zone */}
          <div className="glass-card settings-card settings-danger fade-up">
            <h3 className="settings-card-title danger-title">Danger Zone</h3>
            <p className="settings-danger-desc">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <button
              className="btn-danger"
              onClick={deleteAccount}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete My Account"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Settings;
