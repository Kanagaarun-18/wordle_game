import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = "https://wordle-game-h86q.onrender.com";

function Game({ userId }: any) {
  const [grid, setGrid] = useState(
    Array(6).fill(null).map(() => Array(5).fill(""))
  );

  const [colors, setColors] = useState(
    Array(6).fill(null).map(() => Array(5).fill("empty"))
  );

  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);

  const [gameId, setGameId] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [playedToday, setPlayedToday] = useState(false);
  const [correctWord, setCorrectWord] = useState("");

  const buffer = useRef<string[]>(Array(5).fill(""));

  // ---------------- START GAME ----------------
  useEffect(() => {
    const init = async () => {
      const res = await axios.get(`${API}/game/daily/${userId}`);

      const type = res.data.playedToday ? "practice" : "daily";
      setPlayedToday(res.data.playedToday);

      const start = await axios.post(`${API}/game/start`, {
        userId,
        type
      });

      setGameId(start.data.gameId);
    };

    init();
  }, [userId]);

  // ---------------- RESET ----------------
  const reset = () => {
    setGrid(Array(6).fill(null).map(() => Array(5).fill("")));
    setColors(Array(6).fill(null).map(() => Array(5).fill("empty")));
    setRow(0);
    setCol(0);
    setGameOver(false);
    setCorrectWord("");
    buffer.current = Array(5).fill("");
  };

  // ---------------- SUBMIT GUESS ----------------
  const submitGuess = async () => {
    const guess = buffer.current.join("");
    if (guess.length !== 5) return;

    const res = await axios.post(`${API}/game/guess`, {
      gameId,
      guess
    });

    if (!res.data.valid) {
      alert("Not a valid word");
      return;
    }

    const newColors = [...colors];
    newColors[row] = res.data.result;
    setColors(newColors);

    if (res.data.correctWord) {
      setCorrectWord(res.data.correctWord);
    }

    if (res.data.gameOver) {
      setGameOver(true);

      await axios.post(`${API}/game/save`, {
        userId,
        attempts: res.data.attempts,
        won: res.data.isWin,
        type: playedToday ? "practice" : "daily"
      });

      return;
    }

    setRow(row + 1);
    setCol(0);
    buffer.current = Array(5).fill("");
  };

  // ---------------- KEYBOARD ----------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!gameId || gameOver) return;

      const key = e.key.toUpperCase();

      if (/^[A-Z]$/.test(key) && col < 5) {
        buffer.current[col] = key;

        const g = [...grid];
        g[row][col] = key;
        setGrid(g);

        setCol(col + 1);
      }

      if (e.key === "Backspace" && col > 0) {
        buffer.current[col - 1] = "";

        const g = [...grid];
        g[row][col - 1] = "";
        setGrid(g);

        setCol(col - 1);
      }

      if (e.key === "Enter" && col === 5) {
        submitGuess();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameId, gameOver, row, col, grid]);

  // ---------------- UI ----------------
  return (
    <div className="game-container">
      <h1>WORDLE</h1>

      <h3>
        {playedToday ? "Practice Mode" : "Daily Challenge"}
      </h3>

      {/* GRID */}
      <div className="grid">
        {grid.map((r, i) => (
          <div key={i} className="row">
            {r.map((letter, j) => (
              <div
                key={j}
                className={`tile ${colors[i][j]}`}
              >
                {letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* RESULT */}
      {gameOver && (
        <div className="result">
          {colors[row]?.every(c => c === "green")
            ? "🎉 You Won!"
            : "❌ You Lost!"}

          <br />
          <b>Correct Word: {correctWord}</b>

          {playedToday && (
            <button
              className="replay-btn"
              onClick={reset}
            >
              Replay Practice
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Game;