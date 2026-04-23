const fs = require("fs");
const path = require("path");

const words = fs
  .readFileSync(path.join(__dirname, "../words.txt"), "utf-8")
  .split("\n")
  .map(w => w.trim().toUpperCase())
  .filter(w => w.length === 5);

module.exports = words;