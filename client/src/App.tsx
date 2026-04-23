import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./Login";
import Game from "./Game";
import Navbar from "./Navbar";

function Leaderboard() {
  return <h2>Leaderboard Page</h2>;
}

function Profile() {
  return <h2>Profile Page</h2>;
}

function App() {
  const [userId, setUserId] = useState(localStorage.getItem("userId"));

  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login setUser={setUserId} />} />

        <Route
          path="/wordle"
          element={
            userId ? (
              <Game userId={userId} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;