import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiClientError } from "../api/client";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@demo.com", badge: "👑" },
  { role: "Sales", email: "sales@demo.com", badge: "💼" },
  { role: "Warehouse", email: "warehouse@demo.com", badge: "📦" },
  { role: "Accounts", email: "accounts@demo.com", badge: "📊" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(targetEmail = email, targetPassword = password) {
    setError("");
    setLoading(true);
    try {
      await login(targetEmail, targetPassword);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleLogin();
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Operations Portal</h1>
        <p className="subtitle">Sign in with your work account</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@demo.com"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password123!"
          />
        </div>
        <button className="btn-accent" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 8, marginTop: 0 }}>
            ⚡ One-Click Demo Logins (Password: <code style={{ background: "var(--paper)", padding: "2px 4px", borderRadius: 4 }}>Password123!</code>):
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                className="btn-ghost"
                style={{
                  fontSize: 12,
                  padding: "6px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  borderColor: email === acc.email ? "var(--accent)" : undefined,
                  background: email === acc.email ? "#fdf2e0" : undefined,
                }}
                onClick={() => {
                  setEmail(acc.email);
                  setPassword("Password123!");
                  handleLogin(acc.email, "Password123!");
                }}
              >
                <span>{acc.badge}</span>
                <span>{acc.role}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}

