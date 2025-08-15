import React, { useState } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE || "https://loyalty-backend.onrender.com";

function App() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [points, setPoints] = useState(null);
  const [msg, setMsg] = useState("");

  async function api(path, opts = {}) {
    opts.headers = {
      ...(opts.headers || {}),
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(API_BASE + path, opts);
    return res.json();
  }

  async function handleAuth(e) {
    e.preventDefault();
    const route = mode === "login" ? "/api/login" : "/api/register";
    const res = await api(route, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (res.token) {
      setToken(res.token);
      setMsg("");
      fetchPoints(res.token);
    } else {
      setMsg(res.error || res.message);
    }
  }

  async function fetchPoints(authToken = token) {
    const res = await fetch(`${API_BASE}/api/points`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    setPoints(data.points);
  }

  async function addPoints() {
    const amount = Number(prompt("Aantal punten erbij:"));
    if (!amount || isNaN(amount)) return;
    await api("/api/points", {
      method: "POST",
      body: JSON.stringify({ add: amount }),
    });
    fetchPoints();
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: "50px auto" }}>
        <h2>Loyalty App</h2>
        <form onSubmit={handleAuth}>
          <input
            placeholder="Gebruikersnaam"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            placeholder="Wachtwoord"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{mode === "login" ? "Inloggen" : "Registreren"}</button>
        </form>
        <button onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Maak account" : "Terug naar login"}
        </button>
        {msg && <div style={{ color: "red", marginTop: 10 }}>{msg}</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h2>Welkom, {username}!</h2>
      <div>
        <strong>Punten:</strong>{" "}
        {points === null ? (
          <button onClick={fetchPoints}>Bekijk punten</button>
        ) : (
          points
        )}
      </div>
      <button onClick={addPoints} style={{ marginTop: 10 }}>
        Voeg punten toe
      </button>
      <button
        onClick={() => {
          setToken("");
          setPoints(null);
        }}
        style={{ marginLeft: 10 }}
      >
        Uitloggen
      </button>
    </div>
  );
}

export default App;