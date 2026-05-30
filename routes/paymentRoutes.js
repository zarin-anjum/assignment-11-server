import dotenv from "dotenv";
dotenv.config();
import express from "express";
import Stripe from "stripe";
import Contest from "../models/Contest.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

router.post("/create-checkout-session", verifyToken, async (req, res) => {
  const { contestId } = req.body;

  try {
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: contest.contestName,
              description: `Entry fee for ${contest.contestName}`,
            },
            unit_amount: contest.entryFee * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      success_url: `${CLIENT_URL}/payment/success?contestId=${contestId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/contest/${contestId}`,
      metadata: {
        contestId: contestId,
        userEmail: req.user.email,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get("/success", verifyToken, async (req, res) => {
  const { contestId, session_id } = req.query;

  try {
    // verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    // check if already registered
    if (contest.registeredUsers.includes(req.user.email)) {
      return res.status(200).json({ message: "Already registered", contest });
    }

    // register user + increment count
    contest.registeredUsers.push(req.user.email);
    contest.participantsCount += 1;
    await contest.save();

    res.status(200).json({ message: "Registration successful", contest });
  } catch (err) {
    console.error("Payment verification error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;