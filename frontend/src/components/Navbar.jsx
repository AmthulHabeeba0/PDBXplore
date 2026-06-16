import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FiUser, FiSettings, FiLogOut, FiX, FiMenu, FiSearch, FiSun, FiMoon } from "react-icons/fi";
import "./Navbar.css";
import Search from "./Search";

function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer when route changes
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); setDrawerOpen(false); };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/explore", label: "Explore Proteins" },
    { to: "/analysis", label: "Ramachandran Analysis" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <div className="nav-inner">
          {/* LEFT — hamburger menu opens drawer */}
          <button className="nav-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <FiMenu size={22} />
          </button>

          {/* LOGO */}
          <Link to="/" className="nav-logo">
            <span className="logo-helix">⬡</span>
            <span className="logo-text">PDBXplore</span>
          </Link>

          {/* RIGHT — search + theme toggle + avatar/login */}
          <div className="nav-right">
            <Search isHero={false} />

            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {/* Replace the avatar button in the top right with this */}
           {user ? (
            <Link
              to="/settings"
              className="nav-avatar"
              title="Profile Settings"
            >
             {user?.username?.charAt(0)?.toUpperCase() || "U"}
             </Link>
          ) : (
              <Link to="/auth" className="nav-login-btn btn-cta">Login</Link>
            )}
          </div>
        </div>
      </nav>

      {/* LEFT-SIDE DRAWER */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-logo">
                <span className="logo-helix">⬡</span> PDBXplore
              </span>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
                <FiX size={20} />
              </button>
            </div>

            <div className="drawer-divider" />

            <nav className="drawer-nav">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`drawer-link ${location.pathname === to ? "drawer-link--active" : ""}`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="drawer-spacer" />
            <div className="drawer-divider" />

            <div className="drawer-profile">
              <div className="drawer-avatar">
                {user ? user.username.charAt(0).toUpperCase() : <FiUser size={18} />}
              </div>
              <div className="drawer-user-info">
                <span className="drawer-username">{user ? user.username : "Guest"}</span>
                {user
                  ? <span className="drawer-email">{user.email}</span>
                  : <Link to="/auth" className="drawer-login-link">Login / Sign up →</Link>
                }
              </div>
            </div>

            <div className="drawer-actions">
              <Link to="/settings" className="drawer-action-btn">
                <FiSettings size={16} /> Settings
              </Link>
              {user && (
                <button className="drawer-action-btn drawer-logout" onClick={handleLogout}>
                  <FiLogOut size={16} /> Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;