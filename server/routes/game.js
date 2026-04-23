const router = require("express").Router();
const Game = require("../models/Game");
const words = require("../utils/words");

// ===============================
// START GAME (FIXED - ALWAYS SAFE)
// ===============================
router.post("/start", async (req, res) => {
  try {
    const { userId, type } = req.body;

    const daysSinceEpoch = Math.floor(
      Date.now() / (1000 * 60 * 60 * 24)
    );

    const word =
      type === "daily"
        ? words[daysSinceEpoch % words.length]
        : words[Math.floor(Math.random() * words.length)];

    const game = new Game({
      userId,
      type,
      currentWord: word, // ✅ ALWAYS SET
      attempts: 0,
      won: false,
      completed: false,
      date: new Date()
    });

    await game.save();

    res.json({ gameId: game._id });
  } catch (err) {
    console.error("START ERROR:", err);
    res.status(500).send("Server error");
  }
});

// ===============================
// GUESS (NO CRASH VERSION)
// ===============================
router.post("/guess", async (req, res) => {
  try {
    const { gameId, guess } = req.body;

    console.log("🔥 GUESS ROUTE HIT");

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(400).json({ error: "Game not found" });
    }

    if (game.completed) {
      return res.status(400).json({ error: "Game already completed" });
    }

    if (!game.currentWord) {
      console.error("❌ Missing word in game:", game);
      return res.status(500).json({ error: "Game has no word" });
    }

    const word = game.currentWord.toLowerCase();

    if (!guess || guess.length !== 5) {
      return res.json({ valid: false });
    }

    const cleanGuess = guess.toLowerCase();

    // ===============================
    // VALIDATION
    // ===============================
    if (!words.includes(cleanGuess)) {
      return res.json({ valid: false });
    }

    // ===============================
    // RESULT CALCULATION
    // ===============================
    const result = [];

    for (let i = 0; i < 5; i++) {
      if (cleanGuess[i] === word[i]) {
        result.push("green");
      } else if (word.includes(cleanGuess[i])) {
        result.push("yellow");
      } else {
        result.push("gray");
      }
    }

    const isWin = cleanGuess === word;

    game.attempts += 1;

    if (isWin) {
      game.won = true;
      game.completed = true;
    }

    if (game.attempts >= 6 && !isWin) {
      game.completed = true;
    }

    await game.save();

    return res.json({
      valid: true,
      result,
      isWin,
      attempts: game.attempts,
      gameOver: game.completed,
      correctWord: game.completed ? word : null
    });

  } catch (err) {
    console.error("GUESS ERROR:", err);
    return res.status(500).json({ error: "Server crash" });
  }
});

// ===============================
// DAILY STATUS
// ===============================
router.get("/daily/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const game = await Game.findOne({
      userId,
      type: "daily",
      date: { $gte: start, $lte: end }
    });

    res.json({ playedToday: !!game });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ===============================
// SAVE GAME
// ===============================
router.post("/save", async (req, res) => {
  try {
    const { userId, attempts, won, type } = req.body;

    const game = new Game({
      userId,
      attempts,
      won,
      type: type || "daily",
      completed: true,
      date: new Date()
    });

    await game.save();
    res.json({ message: "Game saved" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving game");
  }
});

module.exports = router;