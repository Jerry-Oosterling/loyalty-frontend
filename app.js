import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const JWT_SECRET = process.env.JWT_SECRET || "geheim";

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Routes
app.get("/", (req, res) => res.json({ hello: "loyalty app!" }));

// Registreren
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Gebruikersnaam en wachtwoord verplicht." });
  const hash = await bcrypt.hash(password, 10);
  try {
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
      username,
      hash,
    ]);
    res.json({ message: "Account aangemaakt" });
  } catch (e) {
    res.status(400).json({ error: "Gebruiker bestaat al" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);
  if (result.rows.length === 0) return res.status(400).json({ error: "Onbekend account" });
  const valid = await bcrypt.compare(password, result.rows[0].password);
  if (!valid) return res.status(401).json({ error: "Wachtwoord klopt niet" });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1d" });
  res.json({ token });
});

// Protected endpoint (voorbeeld)
app.get("/api/profile", authenticateToken, async (req, res) => {
  const result = await pool.query("SELECT username FROM users WHERE username=$1", [req.user.username]);
  res.json(result.rows[0]);
});

// Loyality points (voorbeeld)
app.get("/api/points", authenticateToken, async (req, res) => {
  const result = await pool.query("SELECT points FROM users WHERE username=$1", [req.user.username]);
  res.json({ points: result.rows[0]?.points || 0 });
});

app.post("/api/points", authenticateToken, async (req, res) => {
  const { add } = req.body;
  await pool.query("UPDATE users SET points=COALESCE(points,0)+$1 WHERE username=$2", [add, req.user.username]);
  res.json({ ok: true });
});

app.listen(port, () => console.log(`Server draait op poort ${port}`));