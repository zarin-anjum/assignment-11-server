import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import verifyToken from "../middleware/verifyToken.js";
import Contest from "../models/Contest.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, photo } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(200).json(existing);
    }

    const newUser = await User.create({ name, email, photo });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/jwt", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find().select("-__v");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id/role", verifyToken, async (req, res) => {
  const { role } = req.body;

  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/participated", verifyToken, async (req, res) => {
  try {
    const contests = await Contest.find({
      registeredUsers: req.user.email,
    }).select("-submissions -__v");
    res.status(200).json(contests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/winnings", verifyToken, async (req, res) => {
  try {
    const contests = await Contest.find({
      "winner.email": req.user.email,
    }).select("contestName type prizeMoney winner");
    res.status(200).json(contests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/me", verifyToken, async (req, res) => {
  const { name, photo, bio } = req.body;
  try {
    const updated = await User.findOneAndUpdate(
      { email: req.user.email },
      { name, photo, bio },
      { new: true },
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const winners = await Contest.aggregate([
      { $match: { "winner.email": { $ne: null } } },
      { $group: { _id: "$winner.email", wins: { $sum: 1 }, name: { $first: "$winner.name" }, photo: { $first: "$winner.photo" } } },
      { $sort: { wins: -1 } },
      { $limit: 20 },
    ]);
    res.status(200).json(winners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
