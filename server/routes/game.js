const router = require("express").Router();
const Game = require("../models/Game");
const words = require("../utils/words");

// normalize words once
const WORD_LIST = words.map(w => w.trim().toLowerCase());

// ===============================
// START GAME
// ===============================
router.post("/start", async (req, res) => {
  try {
    const { userId, type } = req.body;

    // DAILY: reuse today's game
    if (type === "daily") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const existing = await Game.findOne({
        userId,
        type: "daily",
        date: { $gte: start }
      });

      if (existing) {
        return res.json({ gameId: existing._id });
      }
    }

    const index = Math.floor(
      Date.now() / (1000 * 60 * 60 * 24)
    ) % WORD_LIST.length;

    const word =
      type === "daily"
        ? WORD_LIST[index]
        : WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];

    const game = new Game({
      userId,
      type,
      currentWord: word,
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
// GUESS
// ===============================
router.post("/guess", async (req, res) => {
  try {
    const { gameId, guess } = req.body;

    console.log("GUESS:", guess);

    const game = await Game.findById(gameId);

    if (!game) {
      return res.status(400).json({ error: "Game not found" });
    }

    if (game.completed) {
      return res.status(400).json({ error: "Game completed" });
    }

    const word = (game.currentWord || "").toLowerCase();
    const cleanGuess = (guess || "").toLowerCase();

    if (!word || cleanGuess.length !== 5) {
      return res.json({ valid: false });
    }

    // dictionary check
    if (!WORD_LIST.includes(cleanGuess)) {
      return res.json({ valid: false });
    }

    const result = [];

    for (let i = 0; i < 5; i++) {
      if (cleanGuess[i] === word[i]) result.push("green");
      else if (word.includes(cleanGuess[i])) result.push("yellow");
      else result.push("gray");
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

    res.json({
      valid: true,
      result,
      isWin,
      attempts: game.attempts,
      gameOver: game.completed,
      correctWord: game.completed ? word : null
    });

  } catch (err) {
    console.error("GUESS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===============================
// DAILY STATUS
// ===============================
router.get("/daily/:userId", async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const game = await Game.findOne({
    userId: req.params.userId,
    type: "daily",
    date: { $gte: start }
  });

  res.json({ playedToday: !!game });
});

router.get("/stats/:userId", async (req, res) => {
  try {
    const games = await Game.find({
      userId: req.params.userId,
      type: "daily"
    });

    const total = games.length;
    const wins = games.filter(g => g.won).length;
    const losses = total - wins;

    const winPercentage =
      total === 0 ? 0 : ((wins / total) * 100).toFixed(1);

    const bestAttempt = wins
      ? Math.min(...games.filter(g => g.won).map(g => g.attempts))
      : null;

    const avgAttempts = wins
      ? (
          games.filter(g => g.won)
            .reduce((a, b) => a + b.attempts, 0) / wins
        ).toFixed(2)
      : null;

    res.json({
      totalGames: total,
      wins,
      losses,
      winPercentage,
      bestAttempt,
      avgAttempts,
      streak: 0
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===============================
// LEADERBOARD
// ===============================
router.get("/leaderboard", async (req, res) => {
  try {
    const data = await Game.aggregate([
      { $match: { won: true, type: "daily" } },

      { $sort: { attempts: 1, date: 1 } },

      {
        $group: {
          _id: "$userId",
          attempts: { $first: "$attempts" },
          date: { $first: "$date" }
        }
      },

      { $sort: { attempts: 1, date: 1 } },

      { $limit: 10 },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },

      { $unwind: "$user" },

      {
        $project: {
          _id: 0,
          email: "$user.email",
          attempts: 1,
          date: 1
        }
      }
    ]);

    res.json(data);
  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;