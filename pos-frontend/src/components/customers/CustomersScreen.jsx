import { useEffect, useState } from "react";
import * as api from "../../api/customers";
import * as ordersApi from "../../api/orders";
import { money } from "../../utils/money";

const EMPTY = { name: "", phone: "", email: "", address: "", notes: "" };

export default function CustomersScreen({ notify }) {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  async function load() {
    try { setList(await api.getCustomers()); } catch (e) { notify(e.message); }
  }
  useEffect(() => { load(); }, []);

  const shown = list.filter((c) =>
    [c.name, c.phone, c.email].some((v) => (v ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    try {
      if (editId) await api.updateCustomer(editId, form);
      else await api.createCustomer(form);
      notify(editId ? "Customer updated" : "Customer added", "ok");
      setForm(EMPTY);
      setEditId(null);
      load();
    } catch (err) {
      notify(err.message);
    }
  }
  const [history, setHistory] = useState(null);

    async function showHistory(c) {
        try {
            const orders = await ordersApi.getOrdersByCustomer(c.id);
            const spent = orders.reduce((s, o) => s + Number(o.grandTotal), 0);
            setHistory({ customer: c, orders, spent });
        } catch (e) {
            notify(e.message);
        }
    }

  function edit(c) {
    setEditId(c.id);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", notes: c.notes ?? "" });
  }

  async function remove(c) {
    if (!window.confirm(`Remove ${c.name}? Past orders are kept.`)) return;
    try { await api.deleteCustomer(c.id); load(); } catch (err) { notify(err.message); }
  }

  return (
    <section className="screen">
      <h2>Customers</h2>
      <form className="panel formgrid" onSubmit={submit}>
        <label>Name<input value={form.name} onChange={set("name")} required /></label>
        <label>Phone<input value={form.phone} onChange={set("phone")} /></label>
        <label>Email<input type="email" value={form.email} onChange={set("email")} /></label>
        <label>Address<input value={form.address} onChange={set("address")} /></label>
        <label className="wide">Notes<input value={form.notes} onChange={set("notes")} /></label>
        <div className="btns">
          <button className="primary" type="submit">{editId ? "Save changes" : "Add customer"}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
        </div>
      </form>

      <div className="skubar">
        <input placeholder="Search name, phone, email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid-wrap">
        <table className="grid">
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th></th></tr></thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={5}>No customers found.</td></tr>}
            {shown.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td><td>{c.phone}</td><td>{c.email}</td><td>{c.address}</td>
                <td className="r">
                  <button onClick={() => edit(c)}>Edit</button>{" "}
                  <button onClick={() => showHistory(c)}>History</button>{" "}
                  <button onClick={() => remove(c)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {history && (
            <div className="panel">
                <h3>{history.customer.name}</h3>
                <div className="kv"><span>Orders</span><b>{history.orders.length}</b></div>
                <div className="kv"><span>Total spent</span><b>{money(history.spent)}</b></div>
                <div className="kv"><span>Last purchase</span>
                <b>{history.orders[0] ? new Date(history.orders[0].createdAt).toLocaleDateString() : "-"}</b>
                </div>
                <table className="grid">
                <thead><tr><th>#</th><th>Date</th><th className="r">Total</th></tr></thead>
                <tbody>
                    {history.orders.map((o) => (
                    <tr key={o.id}>
                        <td>{o.id}</td>
                        <td>{new Date(o.createdAt).toLocaleString()}</td>
                        <td className="r">{money(o.grandTotal)}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
                <button onClick={() => setHistory(null)}>Close</button>
            </div>
            )}
      </div>
    </section>
  );
}