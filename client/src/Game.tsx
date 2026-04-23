import { useEffect, useState } from "react";
import axios from "axios";

function Game({ userId }: any) {
  const [grid, setGrid] = useState<string[][]>(
    Array(6).fill(null).map(() => Array(5).fill(""))
  );

  const [colors, setColors] = useState<string[][]>(
    Array(6).fill(null).map(() => Array(5).fill("#222"))
  );

  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [playedToday, setPlayedToday] = useState(false);
  const [gameId, setGameId] = useState("");
  const [lastGuess, setLastGuess] = useState("");
  const [correctWord, setCorrectWord] = useState("");

  // ✅ Start game (NO WORD IN FRONTEND)
  useEffect(() => {
    axios
      .get(`https://wordle-game-h86q.onrender.com/game/daily/${userId}`)
      .then(async (res) => {
        const played = res.data.playedToday;
        setPlayedToday(played);

        const type = played ? "practice" : "daily";

        const r = await axios.post("https://wordle-game-h86q.onrender.com/game/start", {
          userId,
          type
        });

        setGameId(r.data.gameId);
      });
  }, [userId]);

  // ✅ Keyboard handler
  useEffect(() => {
    const handleKey = async (e: KeyboardEvent) => {
      if (!gameId || gameOver) return;

      const key = e.key.toUpperCase();

      // LETTER
      if (/^[A-Z]$/.test(key) && col < 5) {
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = key;
        setGrid(newGrid);
        setCol(prev => prev + 1);
      }

      // BACKSPACE
      if (e.key === "Backspace" && col > 0) {
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col - 1] = "";
        setGrid(newGrid);
        setCol(prev => prev - 1);
      }

      // ENTER
      if (e.key === "Enter" && col === 5) {
        const guess = grid[row].join("");
        setLastGuess(guess);

        try {
          const res = await axios.post(
            "https://wordle-game-h86q.onrender.com/game/guess",
            {
              gameId,
              guess
            }
          );

          if (!res.data.valid) {
            alert("Not a valid word");
            return;
          }

          const newColors = colors.map(r => [...r]);
          newColors[row] = res.data.result;
          setColors(newColors);

          if (res.data.correctWord) {
            setCorrectWord(res.data.correctWord);
          }

          if (res.data.gameOver) {
            setGameOver(true);

            await axios.post("https://wordle-game-h86q.onrender.com/game/save", {
              userId,
              attempts: res.data.attempts,
              won: res.data.isWin,
              type: playedToday ? "practice" : "daily"
            });

            return;
          }

          setRow(prev => prev + 1);
          setCol(0);

        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [grid, row, col, colors, gameId, gameOver, playedToday]);

  return (
    <div className="game-container">
      <h1>WORDLE</h1>

      {!playedToday ? (
        <h3>🌅 New Daily Challenge</h3>
      ) : (
        <h3>♻️ Practice Mode</h3>
      )}

      {/* GRID */}
      <div className="grid">
        {grid.map((r, i) => (
          <div key={i} className="row">
            {r.map((letter, j) => {
              const colorClass =
                colors[i][j] === "green"
                  ? "green"
                  : colors[i][j] === "gold"
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
          {lastGuess === correctWord ? (
            "🎉 You Won!"
          ) : (
            <>
              ❌ You Lost! <br />
              <span style={{ opacity: 0.8 }}>
                Correct word: <strong>{correctWord}</strong>
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Game;