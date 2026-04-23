const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===============================
// SIGNUP (FIXED)
// ===============================
router.post("/signup", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.trim().toLowerCase();

    // check duplicate user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed
    });

    return res.json({
      userId: user._id,
      email: user.email
    });

  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


// ===============================
// LOGIN (FIXED)
// ===============================
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    console.log("LOGIN BODY:", req.body);

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });

    console.log("USER FOUND:", user);

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // OPTIONAL JWT (recommended)
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return res.json({
      userId: user._id,
      email: user.email,
      token
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


// ===============================
// GET USER
// ===============================
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;