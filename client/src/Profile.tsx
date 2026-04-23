import { useEffect, useState } from "react";
import axios from "axios";

function Profile({ userId }: any) {
  const [stats, setStats] = useState<any>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    axios
      .get(`http://localhost:5000/game/stats/${userId}`)
      .then(res => setStats(res.data));
  }, []);
  useEffect(() => {
    axios
      .get(`http://localhost:5000/auth/user/${userId}`)
      .then(res => setEmail(res.data.email));
  }, [userId]);

  if (!stats) return <h2 style={{ textAlign: "center" }}>Loading...</h2>;

  return (
    <div className="page-container">
      <h1>👤 Profile</h1>

      <div className="card">
        <p><strong>Email:</strong> {email}</p>
        <hr />
        <p>Total Games: {stats.totalGames}</p>
        <p>Wins: {stats.wins}</p>
        <p>Losses: {stats.losses}</p>
        <p>Win %: {stats.winPercentage}%</p>
        <p>Best Attempt: {stats.bestAttempt ?? "-"}</p>
        <p>Avg Attempts: {stats.avgAttempts ?? "-"}</p>
        <p>🔥 Streak: {stats.streak}</p>
      </div>
    </div>
  );
}

export default Profile;