import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./Login";
import Game from "./Game";
import Navbar from "./Navbar";
import Leaderboard from "./Leaderboard";
import Profile from "./Profile";

function App() {
  const [userId, setUserId] = useState<string | null>(null);

  // 🔥 LOAD FROM LOCALSTORAGE ON START
  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  return (
    <BrowserRouter>
      {userId && <Navbar />}

      <Routes>
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/login" />} />

        <Route
          path="/login"
          element={<Login setUser={setUserId} />}
        />

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

        <Route
          path="/profile"
          element={
            userId ? (
              <Profile userId={userId} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;