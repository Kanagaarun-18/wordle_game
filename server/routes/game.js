const router = require("express").Router();
const Game = require("../models/Game");
const words = require("../utils/words");


// Save game result
router.post("/save", async (req, res) => {
  try {
    const { userId, attempts, won, type } = req.body;

    const game = new Game({
      userId,
      attempts,
      won,
      type: type || "daily",
      date: new Date()
    });

    await game.save();

    res.json({ message: "Game saved" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving game");
  }
});


// Leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const data = await Game.aggregate([
      // Only winning games
      { $match: { won: true, type: "daily" } },

      // Sort by attempts first, then by date (earlier = better)
      { $sort: { attempts: 1, date: 1 } },

      // Group by user → pick best attempt automatically
      {
        $group: {
          _id: "$userId",
          attempts: { $first: "$attempts" },
          date: { $first: "$date" }
        }
      },

      // Sort again after grouping
      { $sort: { attempts: 1, date: 1 } },

      // Limit to top 10
      { $limit: 10 },

      // Join with user collection
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },

      { $unwind: "$user" },

      // Clean response
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


router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const games = await Game.find({ userId, type: "daily"  }).sort({ date: 1 });

    const total = games.length;
    const wins = games.filter(g => g.won).length;
    const losses = total - wins;

    // ✅ Win %
    const winPercentage = total === 0 ? 0 : ((wins / total) * 100).toFixed(1);

    // ✅ Best attempt
    const wonGames = games.filter(g => g.won);
    const bestAttempt = wonGames.length
      ? Math.min(...wonGames.map(g => g.attempts))
      : null;

    // ✅ Avg attempts
    const avgAttempts = wonGames.length
      ? (
          wonGames.reduce((sum, g) => sum + g.attempts, 0) /
          wonGames.length
        ).toFixed(2)
      : null;

    // ✅ SAFE DATE-BASED STREAK
    const uniqueDates = [
      ...new Set(
        wonGames.map(g => new Date(g.date).toDateString())
      )
    ];

    const sortedDates = uniqueDates
      .map(d => new Date(d))
      .sort((a, b) => b - a);

    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const gameDate = new Date(sortedDates[i]);
      gameDate.setHours(0, 0, 0, 0);

      const diff =
        (current.getTime() - gameDate.getTime()) /
        (1000 * 60 * 60 * 24);

      if (diff === 0 || diff === 1) {
        streak++;
        current = gameDate;
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

//daily challenge status
router.get("/daily/:userId", async (req, res) => {
  const { userId } = req.params;

  const today = new Date().toDateString();

  const game = await Game.findOne({
    userId,
    type: "daily",
    date: {
      $gte: new Date(today)
    }
  });

  res.json({ playedToday: !!game });
});

router.post("/start", async (req, res) => {
  const { userId, type } = req.body;

  // Check if already has active daily game
  const existing = await Game.findOne({
    userId,
    type,
    completed: false
  });

  if (existing) {
    return res.json({ gameId: existing._id });
  }

  // Generate word
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const word =
    type === "daily"
      ? words[daysSinceEpoch % words.length]
      : words[Math.floor(Math.random() * words.length)];

  const game = new Game({
    userId,
    type,
    currentWord: word,
    attempts: 0,
    won: false
  });

  await game.save();

  res.json({ gameId: game._id });
});

router.post("/guess", async (req, res) => {
  const { gameId, guess } = req.body;

  const game = await Game.findById(gameId);

  if (!game || game.completed) {
    return res.status(400).json({ error: "Invalid game" });
  }

  const word = game.currentWord;

  // Validate dictionary
  if (!words.includes(guess)) {
    return res.json({ valid: false });
  }

  // Check result
  const result = [];

  for (let i = 0; i < 5; i++) {
    if (guess[i] === word[i]) result.push("green");
    else if (word.includes(guess[i])) result.push("gold");
    else result.push("gray");
  }

  game.attempts += 1;

  const isWin = guess === word;

  if (isWin) {
    game.won = true;
    game.completed = true;
  }

  if (game.attempts === 6 && !isWin) {
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