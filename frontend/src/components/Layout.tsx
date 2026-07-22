import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          MINI<span>ERP</span>+CRM
        </div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => (isActive ? "active" : "")}>
            Customers
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? "active" : "")}>
            Products &amp; Stock
          </NavLink>
          <NavLink to="/challans" className={({ isActive }) => (isActive ? "active" : "")}>
            Sales Challans
          </NavLink>
        </nav>
        <div className="user-box">
          <strong>{user?.name}</strong>
          <span className="user-role-badge">{user?.role}</span>
          <div style={{ marginTop: 12 }}>
            <button className="btn-logout-sidebar" onClick={handleLogout}>
              🚪 Log out
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="top-header">
          <div className="top-header-user">
            Signed in as <strong>{user?.name}</strong> (<span className="role-tag">{user?.role}</span>)
          </div>
          <button className="btn-logout-top" onClick={handleLogout} title="Log out of application">
            🚪 Log out
          </button>
        </header>
        {children}
      </main>
    </div>
  );
}

