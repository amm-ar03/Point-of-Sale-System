import { useEffect, useState } from "react";
import ProductLookup from "./ProductLookup.jsx";
import PaymentDialog from "./PaymentDialog.jsx";
import MenuBar from "./components/MenuBar.jsx";
import StatusBar from "./components/StatusBar.jsx";
import PosScreen from "./components/pos/PosScreen.jsx";
import StockScreen from "./components/stock/StockScreen.jsx";
import OrdersScreen from "./components/orders/OrdersScreen.jsx";
import { money } from "./utils/money";
import { useCart } from "./hooks/useCarts";
import * as productsApi from "./api/products";
import * as ordersApi from "./api/orders";
import { getConfig } from "./api/config";
import "./App.css";

const EMPTY_LOOKUP = { sku: "", product: null, qty: 1, price: "" };

export default function App() {
  const [tab, setTab] = useState("pos");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [taxRate, setTaxRate] = useState(0);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(true);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookup, setLookup] = useState(EMPTY_LOOKUP);
  const [payOpen, setPayOpen] = useState(false);

  const notify = (msg, type = "error") => setStatus({ type, msg });
  const stockOf = (id) => products.find((p) => p.id === id)?.stockQuantity ?? 0;

  const { cart, selected, setSelected, totals, addItem, changeQty, removeItem, clear, toOrderItems } =
    useCart(taxRate, stockOf);

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

  function addToCart(product, qty, price) {
    const err = addItem(product, qty, price);
    notify(err ?? "", err ? "error" : "");
  }

  async function handleSku(term) {
    try {
      addToCart(await productsApi.getProductBySku(term));
      return true;
    } catch {
      notify(`Product not found: ${term}`);
      return false;
    }
  }

  function handleQty(id, delta) {
    const err = changeQty(id, delta);
    if (err) notify(err);
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

  async function addProduct(payload) {
    try {
      const created = await productsApi.createProduct(payload);
      setProducts((p) => [...p.filter((x) => x.id !== created.id), created]);
      notify("Product saved", "ok");
      return true;
    } catch (e) {
      notify(e.message);
      return false;
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
    try {
      setOrders(await ordersApi.getOrders());
    } catch (e) {
      notify(e.message);
    }
  }

  function handleTab(next) {
    setTab(next);
    if (next === "orders") loadOrders();
  }

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="app">
      <MenuBar tab={tab} onTab={handleTab} />
      <StatusBar status={status} onDismiss={() => notify("", "")} />

      {tab === "pos" && (
        <PosScreen
          cart={cart} selected={selected} setSelected={setSelected}
          totals={totals} taxRate={taxRate}
          onSku={handleSku}
          onInsert={() => { setLookup(EMPTY_LOOKUP); setLookupOpen(true); }}
          onQty={handleQty}
          onDelete={removeItem}
          onCancel={clear}
          onPay={() => setPayOpen(true)}
        />
      )}
      {tab === "stock" && (
        <StockScreen
          products={products}
          onAddProduct={addProduct}
          onAddToSale={(p) => addToCart(p)}
          onDelete={deleteProduct}
        />
      )}
      {tab === "orders" && <OrdersScreen orders={orders} />}

      <ProductLookup
        open={lookupOpen} onClose={() => setLookupOpen(false)}
        onSearch={lookupSearch} onAdd={lookupAdd}
        skuValue={lookup.sku} setSkuValue={(v) => setLookup((l) => ({ ...l, sku: v }))}
        product={lookup.product}
        quantity={lookup.qty} setQuantity={(v) => setLookup((l) => ({ ...l, qty: v }))}
        price={lookup.price} setPrice={(v) => setLookup((l) => ({ ...l, price: v }))}
      />
      <PaymentDialog
        open={payOpen} amountDue={totals.grand}
        onClose={() => setPayOpen(false)} onConfirm={completeSale}
      />
    </div>
  );
}