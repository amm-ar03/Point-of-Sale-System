import { useEffect, useState } from "react";
import ItemSearchScreen from "./components/pos/itemsearch.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import HomeScreen from "./components/HomeScreen.jsx";
import UsersScreen from "./components/UsersScreen.jsx";
import { logout } from "./api/auth.js";
import { useArrowNav } from "./hooks/nav.js";
import PaymentDialog from "./PaymentDialog.jsx";
import MenuBar from "./components/MenuBar.jsx";
import StatusBar from "./components/StatusBar.jsx";
import PosScreen from "./components/pos/PosScreen.jsx";
import StockScreen from "./components/stock/StockScreen.jsx";
import OrdersScreen from "./components/orders/OrdersScreen.jsx";
import { useProducts } from "./hooks/useProducts.js";
import { money } from "./utils/money";
import { useCart } from "./hooks/useCarts";
import * as productsApi from "./api/products";
import * as ordersApi from "./api/orders";
import { getConfig } from "./api/config";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("home");
  
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [taxRate, setTaxRate] = useState(0);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(true);
  //const [lookupOpen, setLookupOpen] = useState(false);
  //const [lookup, setLookup] = useState(EMPTY_LOOKUP);
  const[searchOpen, setSearchOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const arrowNav = useArrowNav();
  const notify = (msg, type = "error") => setStatus({ type, msg });
  const { products, setProducts, refresh, stockOf, add: addProduct, remove: deleteProduct, search } =
  useProducts(notify);

  const { cart, selected, setSelected, totals, addItem, changeQty, removeItem, clear, toOrderItems } =
    useCart(taxRate, stockOf);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [p, c] = await Promise.all([productsApi.getProducts(), getConfig()]);
        if (cancelled) return;
        setProducts(p);
        setTaxRate(c.taxRate ?? 0);
        notify("", "");
      } catch (e) {
        if (!cancelled) notify(`Failed to load: ${e.message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
}, [user]);

// after all hooks, before the loading check:
  if (!user) return <LoginScreen onLogin={setUser} />;

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

  function handleNewSale() {
  if (cart.length && !window.confirm("Clear the current sale and start a new one?")) return;
  clear();
  notify("", "");
  setSearchOpen(true);
}

function handleLogout() {
  logout();
  setUser(null);
  clear();
  setProducts([]);
  setOrders([]);
  setTab("home");
}

function handleGo(target) {
  if (target === "newsale") {
    setTab("pos");
    handleNewSale();
    return;
  }
  handleTab(target);
}
function handleSearchAdd(product, qty, price) {
  return addItem(product, qty, price);
}

  async function completeSale() {
    try {
      const order = await ordersApi.createOrder(toOrderItems());
      clear();
      setPayOpen(false);
      notify(`Sale completed. Order #${order.id}, total ${money(order.grandTotal)}`, "ok");
      setProducts(await refresh());
    } catch (e) {
      notify(`Order failed: ${e.message}`);
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
    <div className="app" onKeyDown={arrowNav}>
      
      <MenuBar tab={tab} onTab={handleTab} user={user} onLogout={handleLogout} />
      <StatusBar status={status} onDismiss={() => notify("", "")} />

      {tab === "home" && <HomeScreen user={user} onGo={handleGo} />}
      {tab === "users" && user.role === "MASTER" && <UsersScreen notify={notify} currentUser={user} />}

      {tab === "pos" && (
        <PosScreen
          cart={cart} selected={selected} setSelected={setSelected}
          totals={totals} taxRate={taxRate}
          onSku={handleSku}
          onNewSale={handleNewSale}
          onInsert={() => setSearchOpen(true)}
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

      <ItemSearchScreen
        open={searchOpen}
        products={products}
        cart={cart}
        onAdd={handleSearchAdd}
        onClose={() => setSearchOpen(false)}
      />
      <PaymentDialog
        open={payOpen} amountDue={totals.grand}
        onClose={() => setPayOpen(false)} onConfirm={completeSale}
      />
    </div>
  );
}