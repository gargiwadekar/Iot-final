import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// For ES module path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ---------- SQLite Database Setup ----------
const db = new Database(path.join(__dirname, "database.db"));

// Create table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    message TEXT,
    date TEXT
  )
`).run();

console.log("✅ Database connected and table ready.");

// ---------- API Routes ----------
app.get("/api/notices", (req, res) => {
  const notices = db.prepare("SELECT * FROM notices ORDER BY id DESC").all();
  res.json(notices);
});

app.post("/api/notices", (req, res) => {
  const { title, message, date } = req.body;
  db.prepare("INSERT INTO notices (title, message, date) VALUES (?, ?, ?)")
    .run(title, message, date);
  res.json({ message: "✅ Notice added successfully" });
});

// ---------- Serve Frontend (React Build) ----------
const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
