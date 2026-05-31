import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import contestRoutes from "./routes/contestRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://contesthub.netlify.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/contests", contestRoutes);
app.use("/users", userRoutes);
app.use("/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.send("ContestHub server is running ✅");
});

const DB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kw0emgd.mongodb.net/contesthub?retryWrites=true&w=majority&appName=Cluster0`;

mongoose
  .connect(DB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });
