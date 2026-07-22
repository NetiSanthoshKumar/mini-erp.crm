import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import { api, ApiClientError } from "../api/client";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [movement, setMovement] = useState({ quantity: "", movementType: "IN", reason: "" });
  const [error, setError] = useState("");

  async function load() {
    const data = await api.get(`/products/${id}`);
    setProduct(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleMovement(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/products/${id}/stock-movements`, {
        quantity: Number(movement.quantity),
        movementType: movement.movementType,
        reason: movement.reason,
      });
      setMovement({ quantity: "", movementType: "IN", reason: "" });
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to record movement");
    }
  }

  if (!product) return <Layout><p>Loading…</p></Layout>;
  const low = product.currentStock <= product.minStockAlertQty;

  return (
    <Layout>
      <button className="btn-ghost" onClick={() => navigate("/products")} style={{ marginBottom: 10 }}>
        ← Back to products
      </button>
      <div className="page-header">
        <div>
          <h1>{product.name}</h1>
          <div className="subtitle mono">{product.sku}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">₹{Number(product.unitPrice).toFixed(2)}</div>
          <div className="stat-label">Unit price</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: low ? "var(--danger)" : "var(--accent)" }}>
          <div className="stat-value">{product.currentStock}</div>
          <div className="stat-label">Current stock {low && "— below alert threshold"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{product.minStockAlertQty}</div>
          <div className="stat-label">Min alert quantity</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 15 }}>{product.location || "—"}</div>
          <div className="stat-label">Location</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Record stock movement</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleMovement} style={{ display: "flex", gap: 10, alignItems: "end" }}>
          <div className="field" style={{ marginBottom: 0, width: 100 }}>
            <label>Type</label>
            <select value={movement.movementType} onChange={(e) => setMovement({ ...movement, movementType: e.target.value })}>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0, width: 100 }}>
            <label>Quantity</label>
            <input type="number" min={1} required value={movement.quantity} onChange={(e) => setMovement({ ...movement, quantity: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0, flex: 1 }}>
            <label>Reason</label>
            <input required placeholder="e.g. Purchase order received, damaged stock write-off…" value={movement.reason} onChange={(e) => setMovement({ ...movement, reason: e.target.value })} />
          </div>
          <button className="btn-primary" type="submit">Record</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Movement log</h3>
        <table>
          <thead><tr><th>Type</th><th>Qty</th><th>Reason</th><th>By</th><th>Date</th></tr></thead>
          <tbody>
            {product.stockMovements?.map((m: any) => (
              <tr key={m.id}>
                <td><Badge value={m.movementType} /></td>
                <td>{m.quantity}</td>
                <td>{m.reason}</td>
                <td>{m.createdBy?.name}</td>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {(!product.stockMovements || product.stockMovements.length === 0) && (
              <tr><td colSpan={5}><div className="empty-state">No movements recorded yet.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
