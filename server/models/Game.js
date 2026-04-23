const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  attempts: Number,
  won: Boolean,
  type: {
    type: String,
    enum: ["daily", "practice"],
    default: "daily"
  },
  date: {
    type: Date,
    default: Date.now
  },
  currentWord: String,
  completed: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Game", gameSchema);