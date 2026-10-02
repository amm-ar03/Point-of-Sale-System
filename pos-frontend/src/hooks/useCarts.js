// src/hooks/useCart.js
import { useMemo, useState } from "react";

export function useCart(taxRate, getStock) {
  const [cart, setCart] = useState([]);
  const [selected, setSelected] = useState(null);

  const totals = useMemo(() => {
    const net = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const taxable = cart.reduce((s, i) => (i.taxExempt ? s : s + i.price * i.quantity), 0);
    const tax = taxable * taxRate;
    return {
      net, tax, grand: net + tax,
      lines: cart.length,
      qty: cart.reduce((s, i) => s + i.quantity, 0),
    };
  }, [cart, taxRate]);

  // Each action returns an error string, or null on success
  function addItem(product, qty = 1, price = null) {
    const unit = price ?? product.price;
    const inCart = cart.find((i) => i.id === product.id)?.quantity ?? 0;
    if (inCart + qty > (product.stockQuantity ?? 0)) {
      return `Not enough stock for ${product.name}. On hand: ${product.stockQuantity}`;
    }
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + qty, price: unit, priceOverridden: unit !== product.price }
            : i
        );
      }
      return [...prev, {
        id: product.id, sku: product.sku, name: product.name, price: unit,
        priceOverridden: unit !== product.price, quantity: qty,
        taxExempt: product.taxExempt ?? false,
      }];
    });
    setSelected(product.id);
    return null;
  }

  function changeQty(id, delta) {
    const current = cart.find((i) => i.id === id)?.quantity ?? 0;
    const next = current + delta;
    if (next > getStock(id)) return `Not enough stock. On hand: ${getStock(id)}`;
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: next } : i)).filter((i) => i.quantity > 0));
    return null;
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
    setSelected(null);
  }

  function clear() {
    setCart([]);
    setSelected(null);
  }

  const toOrderItems = () =>
    cart.map((i) => ({
      productId: i.id,
      quantity: i.quantity,
      unitPrice: i.priceOverridden ? i.price : null,
    }));

  return { cart, selected, setSelected, totals, addItem, changeQty, removeItem, clear, toOrderItems };
}