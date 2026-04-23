import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Game from "./Game";

function App() {
  const userId = localStorage.getItem("userId");

  return (
    <BrowserRouter>
      <Routes>

        {/* DEFAULT ROUTE → LOGIN */}
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />

        {/* PROTECTED GAME ROUTE */}
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