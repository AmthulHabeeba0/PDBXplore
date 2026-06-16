import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home     from "./pages/Home";
import Explore  from "./pages/Explore";
import Protein  from "./pages/Protein";
import Analysis from "./pages/Analysis";
import About    from "./pages/About";
import Contact  from "./pages/Contact";
import Auth     from "./pages/Auth";
import Settings from "./pages/Settings";


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function FadeUpInit() {
  const { pathname } = useLocation();
  useEffect(() => {
    const timer = setTimeout(() => {
      const els = document.querySelectorAll(".fade-up:not(.visible)");
      const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
      }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });
      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add("visible");
        else observer.observe(el);
      });
      return () => observer.disconnect();
    }, 60);
    return () => clearTimeout(timer);
  }, [pathname]);
  return null;
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("pdbx-theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pdbx-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  return (
    <>
      <ScrollToTop />
      <FadeUpInit />
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/explore"           element={<Explore />} />
        <Route path="/protein/:pdb_id"   element={<Protein />} />
        <Route path="/analysis"          element={<Analysis />} />
        <Route path="/about"             element={<About />} />
        <Route path="/contact"           element={<Contact />} />
        <Route path="/auth"              element={<Auth />} />
        <Route path="/settings"          element={<Settings />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
