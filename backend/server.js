import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

// For ES module path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ---------- SQLite Database Setup ----------
let db;
async function initDB() {
  db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      message TEXT,
      date TEXT
    )
  `);
  console.log("✅ Database connected and table ready.");
}
initDB();

// ---------- API Routes ----------
app.get("/api/notices", async (req, res) => {
  const notices = await db.all("SELECT * FROM notices ORDER BY id DESC");
  res.json(notices);
});

app.post("/api/notices", async (req, res) => {
  const { title, message, date } = req.body;
  await db.run(
    "INSERT INTO notices (title, message, date) VALUES (?, ?, ?)",
    [title, message, date]
  );
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
