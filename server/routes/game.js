const router = require("express").Router();
const Game = require("../models/Game");
const words = require("../utils/words");


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
      date: new Date(),
      completed: true
    });

    await game.save();

    res.json({ message: "Game saved" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving game");
  }
});


// ===============================
// LEADERBOARD (BEST DAILY ONLY)
// ===============================
router.get("/leaderboard", async (req, res) => {
  try {
    const data = await Game.aggregate([
      { $match: { won: true, type: "daily" } },

      // sort best first
      { $sort: { attempts: 1, date: 1 } },

      // best game per user
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
// USER STATS
// ===============================
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const games = await Game.find({
      userId,
      type: "daily"
    }).sort({ date: -1 });

    const total = games.length;
    const wins = games.filter(g => g.won).length;
    const losses = total - wins;

    const winPercentage =
      total === 0 ? 0 : ((wins / total) * 100).toFixed(1);

    const wonGames = games.filter(g => g.won);

    const bestAttempt = wonGames.length
      ? Math.min(...wonGames.map(g => g.attempts))
      : null;

    const avgAttempts = wonGames.length
      ? (
          wonGames.reduce((sum, g) => sum + g.attempts, 0) /
          wonGames.length
        ).toFixed(2)
      : null;

    // ===============================
    // SAFE STREAK (FIXED)
    // ===============================
    const streakGames = await Game.find({
      userId,
      type: "daily",
      won: true
    }).sort({ date: -1 });

    let streak = 0;

    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < streakGames.length; i++) {
      const d = new Date(streakGames[i].date);
      d.setHours(0, 0, 0, 0);

      const diffDays =
        (currentDate - d) / (1000 * 60 * 60 * 24);

      if (diffDays === 0 || diffDays === 1) {
        streak++;
        currentDate = d;
      } else {
        break;
      }
    }

    res.json({
      totalGames: total,
      wins,
      losses,
      winPercentage,
      bestAttempt,
      avgAttempts,
      streak
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


// ===============================
// DAILY STATUS (FIXED)
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
    res.status(500).send("Server Error");
  }
});


// ===============================
// START GAME
// ===============================
router.post("/start", async (req, res) => {
  const { userId, type } = req.body;

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
});


// ===============================
// GUESS (FIXED LOGIC ORDER)
// ===============================
router.post("/guess", async (req, res) => {
  const { gameId, guess } = req.body;

  const game = await Game.findById(gameId);

  if (!game || game.completed) {
    return res.status(400).json({ error: "Invalid game" });
  }

  const word = game.currentWord;

  // validate first
  if (!words.includes(guess)) {
    return res.json({ valid: false });
  }

  const result = [];

  for (let i = 0; i < 5; i++) {
    if (guess[i] === word[i]) result.push("green");
    else if (word.includes(guess[i])) result.push("gold");
    else result.push("lightgray");
  }

  const isWin = guess === word;

  // increment AFTER validation
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
});

module.exports = router;