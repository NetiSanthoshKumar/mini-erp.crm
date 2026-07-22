import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import { api, ApiClientError } from "../api/client";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const data = await api.get(`/customers/${id}`);
    setCustomer(data);
    setForm({
      name: data.name,
      mobile: data.mobile,
      email: data.email || "",
      businessName: data.businessName || "",
      status: data.status,
      customerType: data.customerType,
      followUpDate: data.followUpDate ? data.followUpDate.slice(0, 10) : "",
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/customers/${id}`, { ...form, followUpDate: form.followUpDate || undefined });
      setEditing(false);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to save");
    }
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    await api.post(`/customers/${id}/follow-ups`, { note });
    setNote("");
    load();
  }

  if (!customer) return <Layout><p>Loading…</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <button className="btn-ghost" onClick={() => navigate("/customers")} style={{ marginBottom: 10 }}>
            ← Back to customers
          </button>
          <h1>{customer.name}</h1>
          <div className="subtitle">{customer.businessName || "No business name on file"}</div>
        </div>
        <button className="btn-ghost" onClick={() => setEditing((e) => !e)}>
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {editing ? (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSave}>
          {error && <div className="error-banner">{error}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Mobile</label>
              <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="field">
              <label>Follow-up date</label>
              <input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary" type="submit">Save changes</button>
        </form>
      ) : (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div><label>Mobile</label><div className="mono">{customer.mobile}</div></div>
            <div><label>Email</label><div>{customer.email || "—"}</div></div>
            <div><label>Type</label><div>{customer.customerType}</div></div>
            <div><label>Status</label><div><Badge value={customer.status} /></div></div>
            <div><label>GST</label><div className="mono">{customer.gstNumber || "—"}</div></div>
            <div><label>Next follow-up</label><div>{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : "—"}</div></div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Follow-up notes</h3>
        <form onSubmit={handleAddNote} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input placeholder="Add a follow-up note…" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn-primary" type="submit">Add</button>
        </form>
        {customer.followUps?.length ? (
          customer.followUps.map((f: any) => (
            <div key={f.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontSize: 13 }}>{f.note}</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
                {f.createdBy?.name} · {new Date(f.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">No follow-up notes yet.</div>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Recent sales challans</h3>
        {customer.challans?.length ? (
          <table>
            <thead><tr><th>Challan #</th><th>Status</th><th>Qty</th><th>Date</th></tr></thead>
            <tbody>
              {customer.challans.map((c: any) => (
                <tr key={c.id} onClick={() => navigate(`/challans/${c.id}`)}>
                  <td className="mono">{c.challanNumber}</td>
                  <td><Badge value={c.status} /></td>
                  <td>{c.totalQuantity}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No challans yet for this customer.</div>
        )}
      </div>
    </Layout>
  );
}
