import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./models/User.js";
import Notice from "./models/Notice.js";

// --- Setup (for ES modules) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- Connect MongoDB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- AUTH ROUTES ---
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.get("/api/healthz", (req, res) => res.type("text").send("OK"));

app.post("/api/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const finalName = (name || "").trim() || (username || "").trim();

    if (!finalName || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name: finalName, email, password: hashed });

    res.json({ message: "✅ Registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1d",
    });

    res.json({ message: "✅ Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- NOTICE ROUTES ---
app.get("/api/notices", async (req, res) => {
  try {
    const notices = await Notice.find().sort({ _id: -1 });
    res.json(notices);
  } catch (err) {
    console.error("Get notices error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/notices", async (req, res) => {
  try {
    const { title, message, date, userId } = req.body;
    if (!title || !message || !date)
      return res.status(400).json({ message: "All fields required" });

    await Notice.create({ title, message, date, userId });
    res.json({ message: "✅ Notice added" });
  } catch (err) {
    console.error("Add notice error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Serve Frontend (React build) ---
const frontendPath = path.resolve(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

// ✅ Fix route handling (for React Router)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// --- Start Server ---
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
