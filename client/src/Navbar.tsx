import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  const toggleTheme = () => {
    document.body.classList.toggle("light");

    // optional: persist theme
    const isLight = document.body.classList.contains("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
  };

  return (
    <div className="navbar">
      <h2 onClick={() => navigate("/wordle")}>WORDLE</h2>

      <div>
        <button onClick={() => navigate("/leaderboard")}>
          Leaderboard
        </button>

        <button onClick={() => navigate("/profile")}>
          Profile
        </button>

        <button onClick={toggleTheme}>Theme</button>

        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

export default Navbar;