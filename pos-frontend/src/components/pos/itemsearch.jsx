import { useEffect, useMemo, useRef, useState } from "react";
import { money } from "../../utils/money";

export default function ItemSearchScreen({ open, products, cart, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const searchRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [products, query]);

  const product = products.find((p) => p.id === selectedId) ?? null;
  const inCart = cart.find((i) => i.id === selectedId)?.quantity ?? 0;
  const available = product ? (product.stockQuantity ?? 0) - inCart : 0;
  const unit = product ? (price.trim() ? Number(price) : product.price) : 0;
  const overridden = product && price.trim() !== "" && unit !== product.price;

  useEffect(() => {
    if (open) {
      setQuery(""); setSelectedId(null); setQty(1); setPrice(""); setError("");
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  function select(p) {
    setSelectedId(p.id);
    setQty(1);
    setPrice(String(p.price));
    setError("");
  }

  function add() {
    if (!product) return;
    if (!Number.isInteger(qty) || qty <= 0 || !(unit >= 0)) return setError("Invalid quantity or price");
    const err = onAdd(product, qty, unit);
    if (err) return setError(err);
    setError("");
    setQty(1);
    setPrice(String(product.price));
    searchRef.current?.focus();
  }

  function onKeyDown(e) {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!results.length) return;
      const idx = results.findIndex((p) => p.id === selectedId);
      const next = e.key === "ArrowDown" ? Math.min(idx + 1, results.length - 1) : Math.max(idx - 1, 0);
      select(results[next]);
    }
    if (e.key === "Enter" && product) {
      e.preventDefault();
      add();
    }
  }

  if (!open) return null;

  return (
    <div className="overlay" onKeyDown={onKeyDown}>
      <div className="itemscreen">
        <div className="dtitle">New Sale — Item Search</div>

        <div className="item-body">
          <div className="item-left">
            <input
              ref={searchRef}
              type="search"
              className="item-search"
              placeholder="Search by name or SKU…"
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="grid-wrap item-list">
              <table className="grid">
                <thead>
                  <tr><th>Code</th><th>Description</th><th className="r">Price</th><th className="r">Stock</th></tr>
                </thead>
                <tbody>
                  {results.length === 0 && <tr><td colSpan={4}>No products match.</td></tr>}
                  {results.map((p) => (
                    <tr
                      key={p.id}
                      className={`${selectedId === p.id ? "sel" : ""} ${(p.stockQuantity ?? 0) <= 0 ? "out" : ""}`}
                      onClick={() => select(p)}
                      onDoubleClick={() => { select(p); setTimeout(add, 0); }}
                    >
                      <td>{p.sku}</td><td>{p.name}</td>
                      <td className="r">{money(p.price)}</td>
                      <td className="r">{p.stockQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="item-right panel">
            {!product ? (
              <p className="hint">Select a product from the list.</p>
            ) : (
              <>
                <h3>{product.name}</h3>
                <div className="kv"><span>SKU</span><b>{product.sku}</b></div>
                <div className="kv"><span>Stock on hand</span><b>{product.stockQuantity}</b></div>
                <div className="kv"><span>Already in cart</span><b>{inCart}</b></div>
                <div className="kv"><span>Available</span><b className={available <= 0 ? "neg" : ""}>{available}</b></div>
                <div className="kv"><span>Default price</span><b>{money(product.price)}</b></div>
                <div className="kv"><span>Tax</span><b>{product.taxExempt ? "Exempt" : "Taxable"}</b></div>

                <div className="row"><label>Quantity</label>
                  <input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></div>
                <div className="row"><label>Price</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                {overridden && <div className="hint warn">Price overridden for this sale.</div>}

                <div className="kv total"><span>Line total</span><b>{money(unit * (qty || 0))}</b></div>
                {error && <div className="hint warn">{error}</div>}
                <button className="primary" disabled={available <= 0} onClick={add}>Add to Sale</button>
              </>
            )}
          </aside>
        </div>

        <div className="dfoot">
          <em>↑↓ select · Enter add · Esc close</em>
          <button onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}