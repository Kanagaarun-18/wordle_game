import { useEffect, useState } from "react";
import axios from "axios";

function Game({ userId }: any) {
  const [grid, setGrid] = useState(
    Array(6).fill(null).map(() => Array(5).fill(""))
  );

  const [colors, setColors] = useState(
    Array(6).fill(null).map(() => Array(5).fill("#222"))
  );

  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [playedToday, setPlayedToday] = useState(false);
  const [gameId, setGameId] = useState("");
  const [correctWord, setCorrectWord] = useState("");

  // =========================
  // RESET GAME
  // =========================
  const resetGame = () => {
    setGrid(Array(6).fill(null).map(() => Array(5).fill("")));
    setColors(Array(6).fill(null).map(() => Array(5).fill("#222")));
    setRow(0);
    setCol(0);
    setGameOver(false);
    setCorrectWord("");
    setGameId("");
  };

  // =========================
  // START GAME
  // =========================
  const startGame = async (type: "daily" | "practice") => {
    const r = await axios.post(
      "https://wordle-game-h86q.onrender.com/game/start",
      { userId, type }
    );

    setGameId(r.data.gameId);
  };

  useEffect(() => {
    axios
      .get(`https://wordle-game-h86q.onrender.com/game/daily/${userId}`)
      .then(async (res) => {
        const played = res.data.playedToday;
        setPlayedToday(played);

        const type = played ? "practice" : "daily";
        await startGame(type);
      });
  }, [userId]);

  // =========================
  // REPLAY PRACTICE
  // =========================
  const replayPractice = async () => {
    resetGame();
    await startGame("practice");
  };

  // =========================
  // SUBMIT GUESS (FIXED CORE LOGIC)
  // =========================
  const handleSubmitGuess = async (guess: string) => {
    try {
      const res = await axios.post(
        "https://wordle-game-h86q.onrender.com/game/guess",
        { gameId, guess }
      );

      if (!res.data.valid) {
        alert("Not a valid word");
        return;
      }

      setColors(prev => {
        const newColors = prev.map(r => [...r]);
        newColors[row] = res.data.result;
        return newColors;
      });

      if (res.data.correctWord) {
        setCorrectWord(res.data.correctWord);
      }

      if (res.data.gameOver) {
        setGameOver(true);

        await axios.post(
          "https://wordle-game-h86q.onrender.com/game/save",
          {
            userId,
            attempts: res.data.attempts,
            won: res.data.isWin,
            type: playedToday ? "practice" : "daily"
          }
        );
        return;
      }

      setRow(r => r + 1);
      setCol(0);

    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // KEYBOARD HANDLER (FIXED)
  // =========================
  useEffect(() => {
    const handleKey = async (e: KeyboardEvent) => {
      if (!gameId || gameOver) return;

      const key = e.key.toUpperCase();

      // LETTER INPUT
      if (/^[A-Z]$/.test(key) && col < 5) {
        setGrid(prev => {
          const newGrid = prev.map(r => [...r]);
          newGrid[row][col] = key;
          return newGrid;
        });
        setCol(c => c + 1);
      }

      // BACKSPACE
      else if (e.key === "Backspace" && col > 0) {
        setGrid(prev => {
          const newGrid = prev.map(r => [...r]);
          newGrid[row][col - 1] = "";
          return newGrid;
        });
        setCol(c => c - 1);
      }

      // ENTER (FIXED)
      else if (e.key === "Enter" && col === 5) {
        const guess = grid[row].slice().join("");
        handleSubmitGuess(guess);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameId, gameOver, row, col, grid]);

  // =========================
  // UI
  // =========================
  return (
    <div className="game-container">
      <h1>WORDLE</h1>

      <h3>
        {playedToday ? "♻️ Practice Mode" : "🌅 New Daily Challenge"}
      </h3>

      {/* GRID */}
      <div className="grid">
        {grid.map((r, i) => (
          <div key={i} className="row">
            {r.map((letter, j) => {
              const colorClass =
                colors[i][j] === "green"
                  ? "green"
                  : colors[i][j] === "yellow"
                  ? "yellow"
                  : "gray";

              return (
                <div key={j} className={`tile ${colorClass}`}>
                  {letter}
                </div>
              );
            })}
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
          <span style={{ opacity: 0.8 }}>
            Correct word: <strong>{correctWord}</strong>
          </span>

          {/* REPLAY ONLY PRACTICE */}
          {playedToday && (
            <button className="replay-btn" onClick={replayPractice}>
              🔁 Replay Practice
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Game;