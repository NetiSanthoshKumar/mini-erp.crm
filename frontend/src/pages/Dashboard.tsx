import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    lowStock: 0,
    draftChallans: 0,
  });

  useEffect(() => {
    (async () => {
      const [customers, products, lowStock, challans] = await Promise.all([
        api.get("/customers?limit=1"),
        api.get("/products?limit=1"),
        api.get("/products?lowStock=true"),
        api.get("/challans?status=DRAFT&limit=1"),
      ]);
      setStats({
        customers: customers.pagination.total,
        products: products.pagination.total,
        lowStock: lowStock.pagination.total,
        draftChallans: challans.pagination.total,
      });
    })();
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(" ")[0]}</h1>
          <div className="subtitle">Here's what's happening across operations today.</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.customers}</div>
          <div className="stat-label">Total customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.products}</div>
          <div className="stat-label">Products in catalog</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: stats.lowStock > 0 ? "var(--danger)" : "var(--accent)" }}>
          <div className="stat-value">{stats.lowStock}</div>
          <div className="stat-label">Low stock alerts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.draftChallans}</div>
          <div className="stat-label">Draft challans pending</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 10, fontSize: 15 }}>Quick actions</h3>
        <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
          Use the sidebar to add customers, manage stock, or create a sales challan.
          Draft challans don't affect stock until confirmed — confirming will
          reduce inventory and block if stock is insufficient.
        </p>
      </div>
    </Layout>
  );
}
