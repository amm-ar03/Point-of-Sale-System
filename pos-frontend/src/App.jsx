import { useEffect, useState } from "react";
import ProductLookup from "./ProductLookup.jsx";
import PaymentDialog from "./PaymentDialog.jsx";
import { money } from "./utils/money";
import { useCart } from "./hooks/useCarts";
import * as productsApi from "./api/products";
import * as ordersApi from "./api/orders";
import { getConfig } from "./api/config";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("pos");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [taxRate, setTaxRate] = useState(0);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(true);

  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookup, setLookup] = useState({ sku: "", product: null, qty: 1, price: "" });
  const [payOpen, setPayOpen] = useState(false);
  const [skuSearch, setSkuSearch] = useState("");
  const [form, setForm] = useState({ name: "", sku: "", price: "", stock: "", taxExempt: false });

  const notify = (msg, type = "error") => setStatus({ type, msg });
  const stockOf = (id) => products.find((p) => p.id === id)?.stockQuantity ?? 0;

  const { cart, selected, setSelected, totals, addItem, changeQty, removeItem, clear, toOrderItems } =
    useCart(taxRate, stockOf);

  const addToCart = (product, qty, price) => {
    const err = addItem(product, qty, price);
    notify(err ?? "", err ? "error" : "");
  };

  useEffect(() => {
    (async () => {
      try {
        const [p, c] = await Promise.all([productsApi.getProducts(), getConfig()]);
        setProducts(p);
        setTaxRate(c.taxRate ?? 0);
      } catch (e) {
        notify(`Failed to load: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSkuSubmit(e) {
    e.preventDefault();
    const term = skuSearch.trim();
    if (!term) return;
    try {
      addToCart(await productsApi.getProductBySku(term));
      setSkuSearch("");
    } catch {
      notify(`Product not found: ${term}`);
    }
  }

  async function lookupSearch() {
    const term = lookup.sku.trim();
    if (!term) return;
    let found = null;
    try {
      found = await productsApi.getProductBySku(term);
    } catch {
      const t = term.toLowerCase();
      found = products.find((p) => p.name.toLowerCase().includes(t) || p.sku?.toLowerCase().includes(t)) ?? null;
    }
    if (!found) notify("No product found");
    setLookup((l) => ({ ...l, product: found, qty: 1, price: found ? String(found.price) : "" }));
  }

  function lookupAdd() {
    const { product, qty, price } = lookup;
    if (!product) return;
    const unit = price.trim() ? Number(price) : product.price;
    if (!Number.isInteger(qty) || qty <= 0 || !(unit >= 0)) return notify("Invalid quantity or price");
    addToCart(product, qty, unit);
    setLookupOpen(false);
  }

  const handleQty = (id, delta) => {
    const err = changeQty(id, delta);
    if (err) notify(err);
  };

  async function completeSale() {
    try {
      const order = await ordersApi.createOrder(toOrderItems());
      clear();
      setPayOpen(false);
      notify(`Sale completed. Order #${order.id}, total ${money(order.grandTotal)}`, "ok");
      setProducts(await productsApi.getProducts());
    } catch (e) {
      notify(`Order failed: ${e.message}`);
    }
  }

  async function addProduct(e) {
    e.preventDefault();
    try {
      const created = await productsApi.createProduct({
        name: form.name, sku: form.sku, price: Number(form.price),
        stockQuantity: Number(form.stock), taxExempt: form.taxExempt,
      });
      setProducts((p) => [...p.filter((x) => x.id !== created.id), created]);
      setForm({ name: "", sku: "", price: "", stock: "", taxExempt: false });
      notify("Product saved", "ok");
    } catch (e2) {
      notify(e2.message);
    }
  }

  async function deleteProduct(id) {
    try {
      await productsApi.deleteProduct(id);
      setProducts((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      notify(e.message);
    }
  }

  async function loadOrders() {
    try { setOrders(await ordersApi.getOrders()); } catch (e) { notify(e.message); }
  }

  // ...loading check and return (...) JSX below



  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="app">
      <nav className="menubar">
        <button className={tab === "pos" ? "on" : ""} onClick={() => setTab("pos")}>POS</button>
        <button className={tab === "stock" ? "on" : ""} onClick={() => setTab("stock")}>Stock</button>
        <button className={tab === "orders" ? "on" : ""} onClick={() => { setTab("orders"); loadOrders(); }}>Orders</button>
      </nav>

      {status.msg && (
        <div className={`status ${status.type}`}>
          {status.msg} <button onClick={() => notify("", "")}>×</button>
        </div>
      )}

      {tab === "pos" && (
        <section className="screen">
          <header className="panel head">
            <div className="field"><label>Store</label><div className="box">01 / Demonstration System</div></div>
            <div className="mode">CASH SALE<small>Till : 00</small></div>
            <div className="due"><span>DUE</span><strong>{money(totals.grand)}</strong></div>
          </header>

          <form className="panel skubar" onSubmit={handleSkuSubmit}>
            <label>SKU</label>
            <input autoFocus value={skuSearch} onChange={(e) => setSkuSearch(e.target.value)} placeholder="Scan or type SKU, press Enter" />
            <button type="submit">Find</button>
          </form>

          <div className="grid-wrap">
            <table className="grid">
              <thead>
                <tr><th>Line</th><th>Code</th><th>Description</th><th className="r">Quantity</th><th className="r">Price</th><th className="r">Discount</th><th className="r">Total</th></tr>
              </thead>
              <tbody>
                {cart.map((i, idx) => (
                  <tr key={i.id} className={selected === i.id ? "sel" : ""} onClick={() => setSelected(i.id)}>
                    <td>{idx + 1}</td><td>{i.sku}</td><td>{i.name}</td>
                    <td className="r">{money(i.quantity)}</td>
                    <td className="r">{money(i.price)}</td>
                    <td className="r">0.00</td>
                    <td className="r">{money(i.price * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="bottom">
            <div className="btns">
              <button onClick={() => { setLookup({ sku: "", product: null, qty: 1, price: "" }); setLookupOpen(true); }}><u>I</u>nsert</button>
              <button disabled={!selected} onClick={() => handleQty(selected, 1)}>Qty +</button>
              <button disabled={!selected} onClick={() => handleQty(selected, -1)}>Qty −</button>
              <button disabled={!selected} onClick={() => removeItem(selected)}><u>D</u>elete</button>
              <button onClick={clear}>Cancel</button>
              <button className="update" disabled={!cart.length} onClick={() => setPayOpen(true)}>Pay</button>
            </div>
            <div className="sums">
              <div className="mini"><span>Lines</span><b>{totals.lines}</b><span>Qty</span><b>{money(totals.qty)}</b></div>
              <div className="mini big">
                <span>Sub Total</span><b>{money(totals.net)}</b>
                <span>VAT {(taxRate * 100).toFixed(0)}%</span><b>{money(totals.tax)}</b>
                <span>Total</span><b>{money(totals.grand)}</b>
              </div>
            </div>
          </footer>
        </section>
      )}

      {tab === "stock" && (
        <section className="screen">
          <form className="panel formrow" onSubmit={addProduct}>
            <input placeholder="Name" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="SKU" value={form.sku} required onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <input type="number" step="0.01" placeholder="Price" value={form.price} required onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input type="number" placeholder="Stock" value={form.stock} required onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <label className="chk"><input type="checkbox" checked={form.taxExempt} onChange={(e) => setForm({ ...form, taxExempt: e.target.checked })} /> Tax exempt</label>
            <button type="submit">Add Product</button>
          </form>
          <div className="grid-wrap">
            <table className="grid">
              <thead><tr><th>ID</th><th>SKU</th><th>Name</th><th className="r">Price</th><th className="r">Stock</th><th>Tax</th><th></th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td><td>{p.sku}</td><td>{p.name}</td>
                    <td className="r">{money(p.price)}</td><td className="r">{p.stockQuantity}</td>
                    <td>{p.taxExempt ? "Exempt" : "Yes"}</td>
                    <td><button onClick={() => addToCart(p)}>Add to sale</button> <button onClick={() => deleteProduct(p.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "orders" && (
        <section className="screen">
          <div className="grid-wrap">
            <table className="grid">
              <thead><tr><th>ID</th><th>Date</th><th className="r">Net</th><th className="r">Tax</th><th className="r">Total</th><th className="r">Items</th></tr></thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={6}>No orders yet.</td></tr>}
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td><td>{o.createdAt}</td>
                    <td className="r">{money(o.netTotal)}</td><td className="r">{money(o.taxAmount)}</td>
                    <td className="r">{money(o.grandTotal)}</td><td className="r">{o.items?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ProductLookup
        open={lookupOpen} onClose={() => setLookupOpen(false)} onSearch={lookupSearch} onAdd={lookupAdd}
        skuValue={lookup.sku} setSkuValue={(v) => setLookup((l) => ({ ...l, sku: v }))}
        product={lookup.product}
        quantity={lookup.qty} setQuantity={(v) => setLookup((l) => ({ ...l, qty: v }))}
        price={lookup.price} setPrice={(v) => setLookup((l) => ({ ...l, price: v }))}
      />
      <PaymentDialog open={payOpen} amountDue={totals.grand} onClose={() => setPayOpen(false)} onConfirm={completeSale} />
    </div>
  );
}