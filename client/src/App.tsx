import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./Login";
import Game from "./Game";

function App() {
  const [userId, setUserId] = useState(localStorage.getItem("userId"));

  return (
    <BrowserRouter>
      <Routes>

        {/* DEFAULT → LOGIN */}
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login setUser={setUserId} />}
        />

        {/* WORDLE (PROTECTED) */}
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

      </Routes>
    </BrowserRouter>
  );
}

export default App;