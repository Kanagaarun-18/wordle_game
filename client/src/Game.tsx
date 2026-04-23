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

  // ===============================
  // INIT GAME
  // ===============================
  useEffect(() => {
    const init = async () => {
      const res = await axios.get(`${API}/game/daily/${userId}`);

      setPlayedToday(res.data.playedToday);

      const type = res.data.playedToday ? "practice" : "daily";

      const start = await axios.post(`${API}/game/start`, {
        userId,
        type
      });

      setGameId(start.data.gameId);
    };

    init();
  }, [userId]);

  // ===============================
  // SUBMIT
  // ===============================
  const submitGuess = async (guess: string) => {
    const res = await axios.post(`${API}/game/guess`, {
      gameId,
      guess
    });

    if (!res.data.valid) {
      alert("Not a valid word");
      return;
    }

    setColors(prev => {
      const copy = prev.map(r => [...r]);
      copy[row] = res.data.result;
      return copy;
    });

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

  const replayPractice = async () => {
    if (!playedToday) return;

    setGrid(Array(6).fill(null).map(() => Array(5).fill("")));
    setColors(Array(6).fill(null).map(() => Array(5).fill("empty")));
    setRow(0);
    setCol(0);
    setGameOver(false);
    setCorrectWord("");
    buffer.current = Array(5).fill("");

    const res = await axios.post(`${API}/game/start`, {
      userId,
      type: "practice"
    });

    setGameId(res.data.gameId);
  };
  // ===============================
  // KEYBOARD
  // ===============================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!gameId || gameOver) return;

      const key = e.key.toUpperCase();

      if (/^[A-Z]$/.test(key)) {
        if (col >= 5) return;

        buffer.current[col] = key;

        setGrid(prev => {
          const copy = prev.map(r => [...r]);
          copy[row][col] = key;
          return copy;
        });

        setCol(c => c + 1);
      }

      else if (e.key === "Backspace") {
        if (col <= 0) return;

        buffer.current[col - 1] = "";

        setGrid(prev => {
          const copy = prev.map(r => [...r]);
          copy[row][col - 1] = "";
          return copy;
        });

        setCol(c => c - 1);
      }

      else if (e.key === "Enter") {
        const guess = buffer.current.join("").toLowerCase();

        console.log("ENTER:", guess);

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
  }, [gameId, gameOver, row, col]);

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

      {playedToday && (
        <button className="replay-btn" onClick={replayPractice}>
          🔁 Replay Practice
        </button>
      )}

    </div>
  );
}

export default Game;