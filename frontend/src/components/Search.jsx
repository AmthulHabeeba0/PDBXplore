import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import API_BASE from "../config";
import "./Search.css";

function Search({ value, onChange, placeholder, isHero = false }) {
  const navigate = useNavigate();
  const [localQuery, setLocalQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [open, setOpen] = useState(false); // For Nav-style popup
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync internal state with prop value
  useEffect(() => {
    setLocalQuery(value || "");
  }, [value]);

  // Debounce logic for suggestions
  useEffect(() => {
    const timeOutId = setTimeout(() => {
      // Only fetch if there is a query longer than 1 character
      if (localQuery.trim().length > 1) {
        fetchSuggestions(localQuery);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 250);
    return () => clearTimeout(timeOutId);
  }, [localQuery]);

  const fetchSuggestions = async (q) => {
    setIsLoading(true);
    try {
      // Calling the search endpoint for autocomplete
      const res = await fetch(`${API_BASE}/protein/search/${encodeURIComponent(q)}`);
      const data = await res.json();
      
      // Ensure data is an array and has items before showing dropdown
      if (Array.isArray(data) && data.length > 0) {
        setSuggestions(data.slice(0, 8)); // Limit to top 8
        setShowDropdown(true); 
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error("Suggestion fetch error:", err);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (pdbId) => {
    // Extract ID (handling both string suggestions or object results)
    const cleanId = typeof pdbId === 'string' ? pdbId.split(" ")[0].toUpperCase() : pdbId.toUpperCase();
    
    setShowDropdown(false);
    setSuggestions([]);

    if (cleanId.length === 4) {
      navigate(`/protein/${cleanId}`);
      if (!isHero) setOpen(false);
      setLocalQuery(""); // Reset after navigation
    } else {
      setLocalQuery(cleanId);
      // Update parent component if needed
      if (onChange) onChange({ target: { value: cleanId } });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && localQuery.trim()) {
      const query = localQuery.trim();
      setShowDropdown(false);
      
      if (query.length === 4 && !query.includes(" ")) {
        navigate(`/protein/${query.toUpperCase()}`);
        if (!isHero) setOpen(false);
      } else {
        if (onChange) onChange({ target: { value: query } });
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Hero Version Rendering ---
  if (isHero) {
    return (
      <div className="search-container-wrapper" ref={dropdownRef}>
        <div className="search-inline">
          <FiSearch size={16} className="search-inline-icon" />
          <input
            className="search-inline-input"
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              if (onChange) onChange(e);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => localQuery.length > 1 && suggestions.length > 0 && setShowDropdown(true)}
            placeholder={placeholder || "Search PDB ID or Protein..."}
          />
          {isLoading && <div className="search-spinner-small" />}
        </div>
        {showDropdown && suggestions.length > 0 && (
          <ul className="search-suggestions">
            {suggestions.map((item, i) => (
              <li key={i} onClick={() => handleSelect(item.pdb_id)}>
                <img src={item.image} alt={item.pdb_id} className="suggestion-thumb" />
                <span>{item.pdb_id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // --- Navbar Version Rendering ---
  return (
    <div className="nav-search" ref={dropdownRef}>
      <button className="nav-search-trigger" onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
        <FiSearch size={17} />
      </button>

      {open && (
        <div className="nav-search-popup">
          <div className="nav-search-input-wrapper">
            <FiSearch size={15} className="popup-icon" />
            <input
              ref={inputRef}
              className="nav-search-input"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
            />
            {isLoading && <div className="search-spinner-small" />}
            <button className="popup-close" onClick={() => { setOpen(false); setLocalQuery(""); setSuggestions([]); }}>
              <FiX size={15} />
            </button>
          </div>
          {showDropdown && suggestions.length > 0 && (
            <ul className="nav-suggestions">
              {suggestions.map((item, i) => (
                <li key={i} onClick={() => handleSelect(item.pdb_id)}>
                  <img src={item.image} alt={item.pdb_id} className="suggestion-thumb" />
                  <span>{item.pdb_id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;