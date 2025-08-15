import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL + "/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });

  function handleInput(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function register(e) {
    e.preventDefault();
    setError("");
    try {
      await fetch(API + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      login(e);
    } catch {
      setError("Registreren mislukt");
    }
  }

  async function login(e) {
    e.preventDefault();
    setError("");
    try {
      const r = await fetch(API + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (d.token) {
        localStorage.setItem("token", d.token);
        setUser(form.username);
        fetchPoints(d.token);
      } else {
        setError(d.error || "Login mislukt");
      }
    } catch {
      setError("Login mislukt");
    }
  }

  async function fetchPoints(token) {
    const r = await fetch(API + "/points", {
      headers: { Authorization: "Bearer " + token }
    });
    const d = await r.json();
    setPoints(d.points || 0);
  }

  async function addPoint() {
    const token = localStorage.getItem("token");
    await fetch(API + "/points", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ add: 1 })
    });
    fetchPoints(token);
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setPoints(null);
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Loyalty App</h2>
      {!user ? (
        <form>
          <input placeholder="Gebruikersnaam" name="username" value={form.username} onChange={handleInput} /><br />
          <input placeholder="Wachtwoord" type="password" name="password" value={form.password} onChange={handleInput} /><br />
          <button onClick={login}>Inloggen</button>{" "}
          <button onClick={register}>Registreren</button>
          {error && <div style={{ color: "red" }}>{error}</div>}
        </form>
      ) : (
        <>
          <div>Welkom, <b>{user}</b>!</div>
          <div>Punten: <b>{points ?? "--"}</b></div>
          <button onClick={addPoint}>+1 punt</button>{" "}
          <button onClick={logout}>Uitloggen</button>
        </>
      )}
    </div>
  );
}