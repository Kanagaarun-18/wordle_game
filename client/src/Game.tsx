import { useEffect, useState, useRef } from "react";
import axios from "axios";

function Game({ userId }: any) {

  // ✅ FIX: move inside component
  const inputRef = useRef<string[]>(Array(5).fill(""));

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

  const resetGame = () => {
    setGrid(Array(6).fill(null).map(() => Array(5).fill("")));
    setColors(Array(6).fill(null).map(() => Array(5).fill("#222")));
    setRow(0);
    setCol(0);
    setGameOver(false);
    setCorrectWord("");
    setGameId("");
    inputRef.current = Array(5).fill(""); // reset buffer
  };

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

  const handleSubmitGuess = async (guess: string) => {
    if (guess.length !== 5) return;

    const res = await axios.post(
      "https://wordle-game-h86q.onrender.com/game/guess",
      { gameId, guess }
    );

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
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!gameId || gameOver) return;

      const key = e.key.toUpperCase();

      if (/^[A-Z]$/.test(key) && col < 5) {
        inputRef.current[col] = key;

        setGrid(prev => {
          const copy = prev.map(r => [...r]);
          copy[row][col] = key;
          return copy;
        });

        setCol(c => c + 1);
      }

      else if (e.key === "Backspace" && col > 0) {
        inputRef.current[col - 1] = "";

        setGrid(prev => {
          const copy = prev.map(r => [...r]);
          copy[row][col - 1] = "";
          return copy;
        });

        setCol(c => c - 1);
      }

      else if (e.key === "Enter" && col === 5) {
        const guess = inputRef.current.join("");
        handleSubmitGuess(guess);
        inputRef.current = Array(5).fill("");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameId, gameOver, row, col]);

  return (
    <div className="game-container">
      <h1>WORDLE</h1>

      <h3>
        {playedToday ? "♻️ Practice Mode" : "🌅 New Daily Challenge"}
      </h3>

      <div className="grid">
        {grid.map((r, i) => (
          <div key={i} className="row">
            {r.map((letter, j) => (
              <div key={j} className="tile">
                {letter}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Game;