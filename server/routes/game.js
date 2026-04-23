const router = require("express").Router();
const Game = require("../models/Game");
const words = require("../utils/words");

// ===============================
// SAVE GAME (optional history)
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

// ===============================
// START GAME
// ===============================
router.post("/start", async (req, res) => {
  try {
    const { userId, type } = req.body;

    // reuse unfinished game
    const existing = await Game.findOne({
      userId,
      type,
      completed: false
    });

    if (existing) {
      return res.json({ gameId: existing._id });
    }

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
      currentWord: word,
      attempts: 0,
      won: false,
      completed: false,
      date: new Date()
    });

    await game.save();

    res.json({ gameId: game._id });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ===============================
// GUESS (CORE GAME ENGINE)
// ===============================
router.post("/guess", async (req, res) => {
  try {
    const { gameId, guess } = req.body;

    const game = await Game.findById(gameId);

    // safety checks
    if (!game || game.completed) {
      return res.status(400).json({ error: "Invalid game" });
    }

    const word = game.currentWord;

    // prevent crash
    if (!word || !guess) {
      return res.status(500).json({
        error: "Missing word or guess"
      });
    }

    // validate length only (IMPORTANT FIX)
    if (guess.length !== 5) {
      return res.json({ valid: false });
    }

    console.log("GAME FOUND:", game);
    console.log("WORD:", game?.currentWord);
    console.log("GUESS:", guess);
    // ===============================
    // RESULT CALCULATION
    // ===============================
    const result = [];

    for (let i = 0; i < 5; i++) {
      if (guess[i] === word[i]) {
        result.push("green");
      } else if (word.includes(guess[i])) {
        result.push("yellow");
      } else {
        result.push("gray");
      }
    }

    const isWin = guess === word;

    // update game state
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
    console.error(err);
    res.status(500).json({ error: "Server crash in guess route" });
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
// LEADERBOARD (BEST PER USER)
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
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ===============================
// STATS
// ===============================
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const games = await Game.find({
      userId,
      type: "daily"
    });

    const total = games.length;
    const wins = games.filter(g => g.won).length;
    const losses = total - wins;

    const winPercentage =
      total === 0 ? 0 : ((wins / total) * 100).toFixed(1);

    const bestAttempt = games.length
      ? Math.min(...games.filter(g => g.won).map(g => g.attempts))
      : null;

    res.json({
      totalGames: total,
      wins,
      losses,
      winPercentage,
      bestAttempt
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;