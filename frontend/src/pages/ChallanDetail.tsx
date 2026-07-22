import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import { api, ApiClientError } from "../api/client";

export default function ChallanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challan, setChallan] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api.get(`/challans/${id}`);
    setChallan(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function transition(status: "CONFIRMED" | "CANCELLED") {
    setError("");
    setBusy(true);
    try {
      await api.patch(`/challans/${id}/status`, { status });
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  if (!challan) return <Layout><p>Loading…</p></Layout>;

  return (
    <Layout>
      <button className="btn-ghost" onClick={() => navigate("/challans")} style={{ marginBottom: 10 }}>
        ← Back to challans
      </button>
      <div className="page-header">
        <div>
          <h1 className="mono">{challan.challanNumber}</h1>
          <div className="subtitle">
            {challan.customer?.name}{challan.customer?.businessName ? ` — ${challan.customer.businessName}` : ""}
          </div>
        </div>
        <Badge value={challan.status} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <table className="line-items">
          <thead><tr><th>Product</th><th>SKU</th><th>Unit price</th><th>Qty</th><th>Line total</th></tr></thead>
          <tbody>
            {challan.items?.map((item: any) => (
              <tr key={item.id}>
                <td>{item.productName}</td>
                <td className="mono">{item.productSku}</td>
                <td>₹{Number(item.unitPrice).toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink-soft)" }}>
          Total quantity: <strong style={{ color: "var(--ink)" }}>{challan.totalQuantity}</strong>
          {" · "}Created by {challan.createdBy?.name} on {new Date(challan.createdAt).toLocaleString()}
        </div>
      </div>

      {challan.status === "DRAFT" && (
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-accent" disabled={busy} onClick={() => transition("CONFIRMED")}>
            Confirm (reduces stock)
          </button>
          <button className="btn-danger" disabled={busy} onClick={() => transition("CANCELLED")}>
            Cancel challan
          </button>
        </div>
      )}
      {challan.status === "CONFIRMED" && (
        <button className="btn-danger" disabled={busy} onClick={() => transition("CANCELLED")}>
          Cancel &amp; restock
        </button>
      )}
    </Layout>
  );
}
