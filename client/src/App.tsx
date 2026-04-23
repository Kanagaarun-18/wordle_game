import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Game from "./Game";
import Leaderboard from "./Leaderboard";
import Navbar from "./Navbar";
import Profile from "./Profile";
import { useState } from "react";

function App() {
  const [user, setUser] = useState(localStorage.getItem("userId"));

  if (!user) return <Login setUser={setUser} />;

  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/game" element={<Game userId={user} />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile userId={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;