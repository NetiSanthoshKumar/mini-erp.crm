import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import { api } from "../api/client";

export default function Challans() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const limit = 15;

  async function load() {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    const data = await api.get(`/challans?${params}`);
    setItems(data.items);
    setTotal(data.pagination.total);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Sales Challans</h1>
          <div className="subtitle">{total} total</div>
        </div>
        <button className="btn-accent" onClick={() => navigate("/challans/new")}>+ New challan</button>
      </div>

      <div className="toolbar">
        <select value={status} onChange={(e) => (setPage(1), setStatus(e.target.value))}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <table>
        <thead>
          <tr><th>Challan #</th><th>Customer</th><th>Total qty</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} onClick={() => navigate(`/challans/${c.id}`)}>
              <td className="mono">{c.challanNumber}</td>
              <td>{c.customer?.businessName || c.customer?.name}</td>
              <td>{c.totalQuantity}</td>
              <td><Badge value={c.status} /></td>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={5}><div className="empty-state">No challans found.</div></td></tr>}
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
