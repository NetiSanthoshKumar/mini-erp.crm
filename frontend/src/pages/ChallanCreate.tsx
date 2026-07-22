import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { api, ApiClientError } from "../api/client";

interface Line { productId: string; quantity: number }

export default function ChallanCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([
        api.get("/customers?limit=100"),
        api.get("/products?limit=200"),
      ]);
      setCustomers(c.items);
      setProducts(p.items);
    })();
  }, []);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: "", quantity: 1 }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function productStock(productId: string) {
    return products.find((p) => p.id === productId)?.currentStock;
  }

  async function handleSubmit(status: "DRAFT" | "CONFIRMED") {
    setError("");
    if (!customerId) return setError("Please select a customer");
    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) return setError("Add at least one product line");

    setSaving(true);
    try {
      const challan = await api.post("/challans", { customerId, status, items: validLines });
      navigate(`/challans/${challan.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to save challan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <button className="btn-ghost" onClick={() => navigate("/challans")} style={{ marginBottom: 10 }}>
        ← Back to challans
      </button>
      <div className="page-header">
        <div>
          <h1>New sales challan</h1>
          <div className="subtitle">Challan number is generated automatically on save</div>
        </div>
      </div>

      <div className="card">
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Customer *</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.businessName ? ` — ${c.businessName}` : ""}
              </option>
            ))}
          </select>
        </div>

        <label style={{ marginTop: 10 }}>Products</label>
        <table className="line-items">
          <thead>
            <tr><th style={{ width: "50%" }}>Product</th><th>Available stock</th><th>Quantity</th><th></th></tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td>
                  <select value={line.productId} onChange={(e) => updateLine(i, { productId: e.target.value })}>
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </td>
                <td>{line.productId ? productStock(line.productId) : "—"}</td>
                <td style={{ width: 100 }}>
                  <input type="number" min={1} value={line.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} />
                </td>
                <td>
                  {lines.length > 1 && (
                    <button type="button" className="btn-ghost" onClick={() => removeLine(i)}>Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="btn-ghost" onClick={addLine} style={{ marginBottom: 20 }}>+ Add product line</button>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-ghost" disabled={saving} onClick={() => handleSubmit("DRAFT")}>
            Save as draft
          </button>
          <button className="btn-accent" disabled={saving} onClick={() => handleSubmit("CONFIRMED")}>
            Save &amp; confirm (reduces stock)
          </button>
        </div>
      </div>
    </Layout>
  );
}
