import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BioBytes from "../components/BioBytes";
import WhyPDBXplore from "../components/WhyPDBXplore";
import Workflow from "../components/Workflow";
import CTA from "../components/CTA";
import FAQ from "../components/FAQ";
import "./Home.css";
import Search from "../components/Search";

// =============================================
// HERO CANVAS — DNA helix + particles + network
// =============================================
function HeroCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);

    // Particles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.5 + 0.2
    }));

    // DNA helix parameters
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.008;

      // ── Background radial glow ──
      const grd = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.6);
      grd.addColorStop(0, "rgba(5,102,141,0.12)");
      grd.addColorStop(1, "rgba(2,24,37,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // ── Particle network ──
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165,190,0,${p.opacity})`;
        ctx.fill();
      });

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(66,122,161,${0.15 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // ── DNA Helix ──
      const helixX = W * 0.78;
      const helixH = H * 0.7;
      const helixTop = H * 0.15;
      const amp = 50;
      const turns = 4;

      for (let i = 0; i <= 100; i++) {
        const progress = i / 100;
        const y = helixTop + progress * helixH;
        const angle1 = progress * Math.PI * 2 * turns + t;
        const angle2 = angle1 + Math.PI;
        const x1 = helixX + Math.sin(angle1) * amp;
        const x2 = helixX + Math.sin(angle2) * amp;

        const alpha = 0.3 + 0.5 * Math.abs(Math.sin(angle1));
        ctx.beginPath();
        ctx.arc(x1, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(5,102,141,${alpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x2, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165,190,0,${alpha * 0.8})`;
        ctx.fill();

        // Rungs (every ~8 steps)
        if (i % 8 === 0) {
          const rungAlpha = 0.2 + 0.3 * Math.abs(Math.sin(angle1));
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.strokeStyle = `rgba(235,242,250,${rungAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" />;
}

// =============================================
// STATS COUNTER
// =============================================
function CountUp({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(ease * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// =============================================
// FADE-UP HOOK
// =============================================
function useFadeUp() {
  useEffect(() => {
    const els = document.querySelectorAll(".fade-up");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// =============================================
// HOME PAGE
// =============================================
function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  useFadeUp();

  const handleSearch = () => {
    if (!query.trim()) return;
    navigate(`/protein/${query.trim().toUpperCase()}`);
  };

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <HeroCanvas />
        <div className="hero-content container">
          <div className="hero-eyebrow fade-up">
            <span className="badge">Bioinformatics Platform</span>
          </div>
          <h1 className="hero-title fade-up">
            Explore Protein<br />
            <span className="hero-title-accent">Structures</span> Like<br />
            Never Before
          </h1>
          <p className="hero-sub fade-up">
            Upload, analyze, and visualize molecular structures with advanced
            bioinformatics tools — powered by the RCSB Protein Data Bank.
          </p>
          <div className="hero-search fade-up">
            <Search 
              isHero={true} 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search by PDB ID or protein name..."
            />
            <button className="btn-cta hero-search-btn" onClick={handleSearch}>
              Search →
            </button>
          </div>
          <div className="hero-links fade-up">
            <Link to="/explore" className="btn-outline">Explore Proteins</Link>
            <Link to="/analysis" className="btn-outline">Rama Analysis</Link>
          </div>
        </div>

        <div className="hero-scroll-hint">
          <div className="scroll-mouse"><div className="scroll-dot" /></div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="stats-bar">
        <div className="container stats-inner">
          {[
            { label: "PDB Structures", value: 220000, suffix: "+" },
            { label: "Protein Analyses", value: 5000, suffix: "+" },
            { label: "Amino Acids Tracked", value: 48, suffix: "M+" },
            { label: "Active Researchers", value: 1200, suffix: "+" },
          ].map(({ label, value, suffix }) => (
            <div key={label} className="stat-item fade-up">
              <div className="stat-number">
                <CountUp target={value} suffix={suffix} />
              </div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── OTHER SECTIONS ── */}
      <BioBytes />
      <WhyPDBXplore />
      <Workflow />
      <CTA />
      <FAQ />
    </>
  );
}

export default Home;
