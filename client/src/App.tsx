import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./Login";
import Game from "./Game";
import Navbar from "./Navbar";
import Leaderboard from "./Leaderboard";
import Profile from "./Profile";

function Board() {
  return (
    <Leaderboard />
  );
}

function Prof() {
  return (
    <Profile />
  );
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

        <Route path="/leaderboard" element={<Board />} />
        <Route path="/profile" element={<Prof />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;