import { useEffect, useState, useRef } from "react";
import axios from "axios";

function Game({ userId }: any) {
  const inputRef = useRef<string[]>(Array(5).fill(""));

  const [grid, setGrid] = useState(
    Array.from({ length: 6 }, () => Array(5).fill(""))
  );

  const [colors, setColors] = useState(
    Array.from({ length: 6 }, () => Array(5).fill("#222"))
  );

  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [playedToday, setPlayedToday] = useState(false);
  const [gameId, setGameId] = useState("");
  const [correctWord, setCorrectWord] = useState("");

  // ================= START GAME =================
  const startGame = async (type: "daily" | "practice") => {
    const res = await axios.post(
      "https://wordle-game-h86q.onrender.com/game/start",
      { userId, type }
    );

    setGameId(res.data.gameId);
  };

  // ================= INIT =================
  useEffect(() => {
    axios
      .get(`https://wordle-game-h86q.onrender.com/game/daily/${userId}`)
      .then(async (res) => {
        const played = res.data.playedToday;
        setPlayedToday(played);

        await startGame(played ? "practice" : "daily");
      });
  }, [userId]);

  // ================= SUBMIT GUESS =================
  const submitGuess = async (guess: string) => {
    if (guess.length !== 5) return;

    const res = await axios.post(
      "https://wordle-game-h86q.onrender.com/game/guess",
      { gameId, guess }
    );

    if (!res.data.valid) {
      alert("Not a valid word");
      return;
    }

    setColors((prev) => {
      const copy = prev.map((r) => [...r]);
      copy[row] = res.data.result;
      return copy;
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
          type: playedToday ? "practice" : "daily",
        }
      );

      return;
    }

    setRow((r) => r + 1);
    setCol(0);
  };

  // ================= KEYBOARD =================
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!gameId || gameOver) return;

      const key = e.key.toUpperCase();

      // LETTER
      if (/^[A-Z]$/.test(key) && col < 5) {
        inputRef.current[col] = key;

        setGrid((prev) => {
          const copy = prev.map((r) => [...r]);
          copy[row][col] = key;
          return copy;
        });

        setCol((c) => c + 1);
      }

      // BACKSPACE
      else if (e.key === "Backspace" && col > 0) {
        inputRef.current[col - 1] = "";

        setGrid((prev) => {
          const copy = prev.map((r) => [...r]);
          copy[row][col - 1] = "";
          return copy;
        });

        setCol((c) => c - 1);
      }

      // ENTER
      else if (e.key === "Enter" && col === 5) {
        const guess = inputRef.current.join("");
        inputRef.current = Array(5).fill("");
        submitGuess(guess);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameId, gameOver, row, col]);

  // ================= UI =================
  return (
    <div className="game-container">
      <h1>WORDLE</h1>

      <h3>
        {playedToday ? "♻️ Practice Mode" : "🌅 Daily Challenge"}
      </h3>

      <div className="grid">
        {grid.map((r, i) => (
          <div key={i} className="row">
            {r.map((letter, j) => {
              const color =
                colors[i][j] === "green"
                  ? "green"
                  : colors[i][j] === "yellow"
                  ? "yellow"
                  : "gray";

              return (
                <div key={j} className={`tile ${color}`}>
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="result">
          {colors[row]?.every((c) => c === "green")
            ? "🎉 You Won!"
            : "❌ You Lost!"}

          <br />
          <span>
            Correct word: <b>{correctWord}</b>
          </span>
        </div>
      )}
    </div>
  );
}

export default Game;