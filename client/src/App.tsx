import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./Login";
import Game from "./Game";

function App() {
  const [user, setUser] = useState(localStorage.getItem("userId"));

  return (
    <BrowserRouter>
      <Routes>

        {/* Default route → LOGIN */}
        <Route
          path="/"
          element={
            user ? <Navigate to="/wordle" /> : <Login setUser={setUser} />
          }
        />

        {/* Wordle protected route */}
        <Route
          path="/wordle"
          element={
            user ? <Game userId={user} /> : <Navigate to="/" />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;