import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { api, ApiClientError } from "../api/client";

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  unitPrice: 0,
  currentStock: 0,
  minStockAlertQty: 0,
  location: "",
};

export default function Products() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const limit = 15;

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (lowStockOnly) params.set("lowStock", "true");
    const data = await api.get(`/products?${params}`);
    setItems(data.items);
    setTotal(data.pagination.total);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, lowStockOnly]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/products", {
        ...form,
        unitPrice: Number(form.unitPrice),
        currentStock: Number(form.currentStock),
        minStockAlertQty: Number(form.minStockAlertQty),
      });
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to add product");
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Products &amp; Stock</h1>
          <div className="subtitle">{total} products in catalog</div>
        </div>
        <button className="btn-accent" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add product"}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleAdd}>
          {error && <div className="error-banner">{error}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div className="field"><label>Name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>SKU *</label><input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div className="field"><label>Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div className="field"><label>Unit price *</label><input type="number" step="0.01" required value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value as any })} /></div>
            <div className="field"><label>Opening stock</label><input type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value as any })} /></div>
            <div className="field"><label>Min stock alert qty</label><input type="number" value={form.minStockAlertQty} onChange={(e) => setForm({ ...form, minStockAlertQty: e.target.value as any })} /></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label>Location / warehouse</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </div>
          <button className="btn-primary" type="submit">Save product</button>
        </form>
      )}

      <div className="toolbar">
        <input
          type="text"
          placeholder="Search name, SKU, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
        />
        <button className="btn-ghost" onClick={() => (setPage(1), load())}>Search</button>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, fontSize: 13 }}>
          <input type="checkbox" style={{ width: "auto" }} checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product</th><th>SKU</th><th>Category</th><th>Unit price</th><th>Stock</th><th>Location</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const low = p.currentStock <= p.minStockAlertQty;
            return (
              <tr key={p.id} onClick={() => navigate(`/products/${p.id}`)}>
                <td>{p.name}</td>
                <td className="mono">{p.sku}</td>
                <td>{p.category || "—"}</td>
                <td>₹{Number(p.unitPrice).toFixed(2)}</td>
                <td className={low ? "low-stock" : ""}>{p.currentStock}{low ? " ⚠" : ""}</td>
                <td>{p.location || "—"}</td>
              </tr>
            );
          })}
          {items.length === 0 && <tr><td colSpan={6}><div className="empty-state">No products found.</div></td></tr>}
        </tbody>
      </table>

      {!lowStockOnly && (
        <div className="pagination">
          <button className="btn-ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {page} of {Math.max(1, Math.ceil(total / limit))}</span>
          <button className="btn-ghost" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </Layout>
  );
}
