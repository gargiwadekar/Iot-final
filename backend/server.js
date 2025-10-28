import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// --- Setup (for ES modules) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- Initialize SQLite database ---
let db;
async function initDB() {
  db = await open({
    filename: process.env.DB_PATH || path.join(__dirname, "database.db"),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      message TEXT,
      date TEXT,
      userId INTEGER
    )
  `);

  console.log("✅ Database ready (users + notices).");
}
initDB();

// --- AUTH ROUTES ---
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.get("/api/healthz", (req, res) => res.type("text").send("OK"));

app.post("/api/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const finalName = (name || "").trim() || (username || "").trim();

    if (!finalName || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const hashed = await bcrypt.hash(password, 10);
    await db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
      finalName,
      email,
      hashed,
    ]);

    res.json({ message: "✅ Registered successfully" });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      res.status(400).json({ message: "Email already registered" });
    } else {
      console.error("Register error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);

    if (!user)
      return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret", {
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
    const notices = await db.all("SELECT * FROM notices ORDER BY id DESC");
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

    await db.run(
      "INSERT INTO notices (title, message, date, userId) VALUES (?, ?, ?, ?)",
      [title, message, date, userId || null]
    );

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
