require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const words = require("./utils/words");

const app = express();
app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use("/auth", require("./routes/auth"));
app.use("/game", require("./routes/game"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(5000, () => console.log("Server running on port 5000"));

// WORD ROUTES

app.get("/word/daily", (req, res) => {
  const daysSinceEpoch = Math.floor(
    Date.now() / (1000 * 60 * 60 * 24)
  );

  const index = daysSinceEpoch % words.length;

  res.json({ word: words[index] });
});

app.get("/word/random", (req, res) => {
  const random =
    words[Math.floor(Math.random() * words.length)];

  res.json({ word: random });
});

app.post("/word/check", (req, res) => {
  const { guess, word } = req.body;

  // Validate dictionary
  if (!words.includes(guess)) {
    return res.json({ valid: false });
  }

  // Check colors
  const result = [];

  for (let i = 0; i < 5; i++) {
    if (guess[i] === word[i]) result.push("green");
    else if (word.includes(guess[i])) result.push("gold");
    else result.push("gray");
  }

  res.json({
    valid: true,
    result,
    isWin: guess === word
  });
});