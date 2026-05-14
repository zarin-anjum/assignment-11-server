import express from "express";
import Contest from "../models/Contest.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { search, sort, limit } = req.query;

  try {
    let query = { status: "approved" };

    if (search) {
      query.$or = [
        { type: { $regex: search, $options: "i" } },
        { contestName: { $regex: search, $options: "i" } },
      ];
    }

    let contestsQuery = Contest.find(query).select("-submissions -registeredUsers -__v");

    if (sort === "popular") {
      contestsQuery = contestsQuery.sort({ participantsCount: -1 });
    } else {
      contestsQuery = contestsQuery.sort({ createdAt: -1 });
    }

    if (limit) {
      contestsQuery = contestsQuery.limit(parseInt(limit));
    }

    const contests = await contestsQuery;
    res.status(200).json(contests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/winners", async (req, res) => {
  try {
    const winners = await Contest.find({
      "winner.name": { $ne: null },
      status: "approved",
    })
      .select("contestName winner prizeMoney")
      .limit(10);

    res.status(200).json(winners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/my", verifyToken, async (req, res) => {
  try {
    const contests = await Contest.find({ createdBy: req.user.email }).select("-__v");
    res.status(200).json(contests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/all-admin", verifyToken, async (req, res) => {
  try {
    const contests = await Contest.find().select("-submissions -__v");
    res.status(200).json(contests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    res.status(200).json(contest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const contest = await Contest.create({
      ...req.body,
      createdBy: req.user.email,
      status: "pending",
    });
    res.status(201).json(contest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    if (contest.createdBy !== req.user.email) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (contest.status === "approved") {
      return res.status(400).json({ message: "Cannot edit an approved contest" });
    }

    const updated = await Contest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id/status", verifyToken, async (req, res) => {
  const { status } = req.body; // "approved" or "rejected"

  try {
    const updated = await Contest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Contest not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id/winner", verifyToken, async (req, res) => {
  const { name, photo, email } = req.body;

  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: "Contest not found" });
    if (contest.createdBy !== req.user.email) {
      return res.status(403).json({ message: "Not authorized" });
    }

    contest.winner = { name, photo, email };
    await contest.save();
    res.status(200).json(contest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id/submit", verifyToken, async (req, res) => {
  const { submissionLink, userName, userPhoto } = req.body;

  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    const already = contest.submissions.find(
      (s) => s.userEmail === req.user.email
    );
    if (already) {
      return res.status(400).json({ message: "Already submitted" });
    }

    contest.submissions.push({
      userEmail: req.user.email,
      userName,
      userPhoto,
      submissionLink,
    });

    await contest.save();
    res.status(200).json({ message: "Submitted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ message: "Contest not found" });

    if (contest.createdBy !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Contest.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Contest deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;