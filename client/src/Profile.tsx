import { useEffect, useState } from "react";
import axios from "axios";

function Profile({ userId }: any) {
  const [stats, setStats] = useState<any>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`https://wordle-game-h86q.onrender.com/game/stats/${userId}`)
      .then(res => setStats(res.data))
      .catch(err => console.log("STATS ERROR:", err));
  }, [userId]);
  useEffect(() => {
    if (!userId) return;

    axios
      .get(`https://wordle-game-h86q.onrender.com/auth/user/${userId}`)
      .then(res => setEmail(res.data.email))
      .catch(err => console.log("EMAIL ERROR:", err));
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