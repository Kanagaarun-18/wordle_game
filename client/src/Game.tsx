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

  const submitGuess = async (guess: string) => {
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

    setRow(r => r + 1);
    setCol(0);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      console.log("KEY PRESSED:", e.key);
      if (!gameId || gameOver) return;
      console.log("gameId:", gameId, "gameOver:", gameOver);

      const key = e.key.toUpperCase();

      if (/^[A-Z]$/.test(key)) {
        if (col >= 5) return;

        buffer.current[col] = key;

        const copy = [...grid];
        copy[row][col] = key;
        setGrid(copy);

        setCol(c => c + 1);
      }

      else if (e.key === "Backspace") {
        if (col <= 0) return;

        buffer.current[col - 1] = "";

        const copy = [...grid];
        copy[row][col - 1] = "";
        setGrid(copy);

        setCol(c => c - 1);
      }

      else if (e.key === "Enter") {
        const guess = buffer.current.join("").toLowerCase();

        if (guess.length !== 5) {
          alert("Enter 5 letters");
          return;
        }

        submitGuess(guess);
        buffer.current = Array(5).fill("");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameId, gameOver, row, col, grid]);

  return (
    <div className="game-container">
      <h1>WORDLE</h1>

      <h3>
        {playedToday ? "Practice Mode" : "Daily Challenge"}
      </h3>

      <div className="grid">
        {grid.map((r, i) => (
          <div key={i} className="row">
            {r.map((letter, j) => (
              <div key={j} className={`tile ${colors[i][j]}`}>
                {letter}
              </div>
            ))}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="result">
          {colors[row]?.every(c => c === "green")
            ? "🎉 You Won!"
            : "❌ You Lost!"}

          <br />
          <b>Correct Word: {correctWord}</b>
        </div>
      )}
    </div>
  );
}

export default Game;