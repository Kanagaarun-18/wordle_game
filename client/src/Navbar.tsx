import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("userId");
    window.location.reload();
  };

  const toggleTheme = () => {
    document.body.classList.toggle("light");
  };

  return (
    <div className="navbar">
      <h2 onClick={() => navigate("/game")}>WORDLE</h2>

      <div className="navbar-buttons">
        <button onClick={() => navigate("/leaderboard")}>Leaderboard</button>
        <button onClick={() => navigate("/profile")}>Profile</button>
        <button onClick={toggleTheme}>Theme</button>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

export default Navbar;