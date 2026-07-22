import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import { api, ApiClientError } from "../api/client";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  businessName?: string;
  customerType: string;
  status: string;
  followUpDate?: string;
}

const emptyForm = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL",
  address: "",
  status: "LEAD",
};

export default function Customers() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const limit = 15;

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const data = await api.get(`/customers?${params}`);
    setItems(data.items);
    setTotal(data.pagination.total);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleAddCustomer(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/customers", form);
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to add customer");
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <div className="subtitle">{total} total</div>
        </div>
        <button className="btn-accent" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add customer"}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleAddCustomer}>
          {error && <div className="error-banner">{error}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Mobile *</label>
              <input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Business name</label>
              <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            </div>
            <div className="field">
              <label>GST number</label>
              <input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
            </div>
            <div className="field">
              <label>Customer type</label>
              <select value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary" type="submit">
            Save customer
          </button>
        </form>
      )}

      <form className="toolbar" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search name, mobile, business…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button className="btn-ghost" type="submit">Search</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Business</th>
            <th>Mobile</th>
            <th>Type</th>
            <th>Status</th>
            <th>Next follow-up</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
              <td>{c.name}</td>
              <td>{c.businessName || "—"}</td>
              <td className="mono">{c.mobile}</td>
              <td>{c.customerType}</td>
              <td><Badge value={c.status} /></td>
              <td>{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={6}><div className="empty-state">No customers found.</div></td></tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button className="btn-ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>Page {page} of {Math.max(1, Math.ceil(total / limit))}</span>
        <button className="btn-ghost" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </Layout>
  );
}
