import API_BASE from "../config";
import { useEffect, useState } from "react";
import "./ProteinCard.css";

function ProteinCard({ pdb_id, image }) {
  const [protein, setProtein] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/protein/${pdb_id}`);
        const data = await res.json();
        setProtein(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDetails();
  }, [pdb_id]);

  return (
    <div className="protein-card">
      <div className="protein-card-img-wrap">
        <img src={image} alt={pdb_id} />
      </div>

      <div className="protein-info">
        <h3>{pdb_id}</h3>
        
        {protein ? (
          <p className="protein-title">{protein.header_information?.title}</p>
        ) : (
          <p className="loading-text">Loading details...</p> 
        )}

        <a href={`/protein/${pdb_id}`}>
          <button className="pcard-button">View Protein</button>
        </a>
      </div>
      {/* I removed the second "protein-info" block that was here */}
    </div>
  );
}

export default ProteinCard;