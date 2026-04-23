import { useEffect, useState } from "react";
import axios from "axios";

function Leaderboard() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    axios.get("http://localhost:5000/game/leaderboard")
      .then(res => setData(res.data));
  }, []);

  return (
    <div className="page-container">
      <h1>🏆 Leaderboard</h1>

      {data.map((item, index) => (
        <div key={index} className="card">
          <span>{index + 1}. {item.email} - </span>
          <span>{item.attempts} tries</span>
        </div>
      ))}
    </div>
  );
}

export default Leaderboard;