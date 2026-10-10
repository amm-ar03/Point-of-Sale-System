import { useEffect, useState } from "react";
import ItemSearchScreen from "./components/pos/itemsearch.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import HomeScreen from "./components/HomeScreen.jsx";
import UsersScreen from "./components/UsersScreen.jsx";
import SaveDraftDialog from "./components/pos/SaveDraftDialog.jsx";
import DraftsScreen from "./components/orders/DraftsScreen.jsx";
import CustomersScreen from "./components/customers/CustomersScreen.jsx";
import BusinessScreen from "./components/business/BusinessScreen.jsx";
import CustomerPickerDialog from "./components/pos/CustomerPickerDialog.jsx";
import * as customersApi from "./api/customers";
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
import { login } from "./api/auth.js";
import "./App.css";

export default function App() {
  const [tab, setTab] = useState("home");
  
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [taxRate, setTaxRate] = useState(0);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [draftMeta, setDraftMeta] = useState(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const [saleCustomer, setSaleCustomer] = useState(null);
  const [pickOpen, setPickOpen] = useState(false);
  //const [lookupOpen, setLookupOpen] = useState(false);
  //const [lookup, setLookup] = useState(EMPTY_LOOKUP);
  const [searchOpen, setSearchOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const arrowNav = useArrowNav();
  const notify = (msg, type = "error") => setStatus({ type, msg });
  const { products, setProducts, refresh, stockOf, add: addProduct, remove: deleteProduct, search } =
  useProducts(notify);

  const { cart, selected, setSelected, totals, addItem, changeQty, removeItem, clear, toOrderItems } =
    useCart(taxRate, stockOf);


  useEffect(() => { login("master", "ChangeMe123!").then(setUser).catch(() => {}); }, []);
  useEffect(() => {
    if (!queue.length) return;
    const [next, ...rest] = queue;
    const product = products.find((p) => p.id === next.productId);
    if (!product) {
      notify(`${next.name} no longer exists and was skipped`);
    } else {
      const price = Number(next.unitPrice);
      const err = addItem(product, next.quantity, price !== Number(product.price) ? price : undefined);
      if (err) notify(`${next.name}: ${err}`);
    }
    setQueue(rest);
  }, [queue]);


  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [p, c, cust] = await Promise.all([productsApi.getProducts(), getConfig(), customersApi.getCustomers().catch(() => [])]);
        if (cancelled) return;
        setProducts(p);
        setTaxRate(c.taxRate ?? 0);
        setCustomers(Array.isArray(cust) ? cust : []);
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
  resetSale();
  notify("", "");
  setSearchOpen(true);
}

function handleLogout() {
  logout();
  setUser(null);
  resetSale();
  setProducts([]);
  setOrders([]);
  setDrafts([]);
  setCustomers([]);
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
    let order;
    if (draftMeta?.id) {
      await ordersApi.saveDraft(draftMeta.id, {
        customerName: saleCustomer?.name ?? draftMeta.customerName,
        customerId: saleCustomer?.id ?? draftMeta.customerId,
        items: toOrderItems(),
      });
      order = await ordersApi.payDraft(draftMeta.id);
    } else {
      order = await ordersApi.createOrder(
        toOrderItems(),
        saleCustomer ? { customerId: saleCustomer.id, customerName: saleCustomer.name } : {}
      );
    }
    resetSale();
    setPayOpen(false);
    notify(`Sale completed. Order #${order.id}, total ${money(order.grandTotal)}`, "ok");
    await refresh();
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
    if (next === "drafts") loadDrafts();
  }

  async function loadDrafts() {
  try { setDrafts(await ordersApi.getDrafts()); } catch (e) { notify(e.message); }
}

function resetSale() {
  clear();
  setDraftMeta(null);
  setSaleCustomer(null);
}

function handleSelectCustomer(id) {
  if (id === "__text") return;
  setSaleCustomer(customers.find((c) => String(c.id) === id) ?? null);
}

async function handleSaveDraftClick() {
  if (!cart.length) return notify("Add at least one item before saving a draft");
  try { setCustomers(await customersApi.getCustomers()); } catch { /* the name can still be typed freely */ }
  setSaveOpen(true);
}

async function handleSaveDraft(customerName, customerId) {
  try {
    await ordersApi.saveDraft(draftMeta?.id, { customerName, customerId, items: toOrderItems() });
    resetSale();
    setSaveOpen(false);
    notify(`Draft saved for ${customerName}`, "ok");
    setTab("home");
  } catch (e) {
    notify(`Could not save draft: ${e.message}`);
  }
}

function handleResume(d) {
  if (cart.length && !window.confirm("Replace the current sale with this draft?")) return;
  clear();
  setDraftMeta({ id: d.id, customerName: d.customerName, customerId: d.customerId });
  setSaleCustomer({ id: d.customerId ?? null, name: d.customerName });
  setQueue(d.items.map((i) => ({
    productId: i.product.id, name: i.product.name, quantity: i.quantity, unitPrice: i.unitPrice,
  })));
  notify(`Editing draft for ${d.customerName}`, "ok");
  setTab("pos");
}

async function handleDeleteDraft(d) {
  if (!window.confirm(`Delete the draft for ${d.customerName}?`)) return;
  try { await ordersApi.deleteDraft(d.id); loadDrafts(); } catch (e) { notify(e.message); }
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
          onCancel={resetSale}
          onSaveDraft={handleSaveDraftClick}
          onPay={() => setPayOpen(true)}
          customer={saleCustomer}
          customers={customers}
          onPickCustomer={handleSelectCustomer}
        />
      )}
      {tab === "drafts" && <DraftsScreen drafts={drafts} onResume={handleResume} onDelete={handleDeleteDraft} />}
        <SaveDraftDialog
          open={saveOpen}
          initialName={saleCustomer?.name ?? draftMeta?.customerName}
          customers={customers}
          onSave={handleSaveDraft}
          onClose={() => setSaveOpen(false)}
        />
      {tab === "customers" && <CustomersScreen notify={notify} />}
      {tab === "business" && <BusinessScreen notify={notify} canEdit={user.role === "MASTER"} />}
        
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

      <CustomerPickerDialog
        open={pickOpen}
        customers={customers}
        current={saleCustomer}
        onPick={(c) => { setSaleCustomer(c); setPickOpen(false); }}
        onClose={() => setPickOpen(false)}
      />
    </div>
  );
}