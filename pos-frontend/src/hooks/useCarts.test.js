// src/hooks/useCart.test.js
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useCart } from "./useCarts";

const apple = { id: 1, sku: "A1", name: "Apple", price: 10, stockQuantity: 5, taxExempt: false };
const bread = { id: 2, sku: "B1", name: "Bread", price: 20, stockQuantity: 5, taxExempt: true };
const stock = { 1: 5, 2: 5 };
const setup = (rate = 0.15) => renderHook(() => useCart(rate, (id) => stock[id] ?? 0));

describe("useCart", () => {
  it("adds an item and computes totals", () => {
    const { result } = setup();
    act(() => { result.current.addItem(apple, 2); });
    expect(result.current.totals.net).toBe(20);
    expect(result.current.totals.tax).toBeCloseTo(3);
    expect(result.current.totals.grand).toBeCloseTo(23);
  });

  it("merges the same product into one line", () => {
    const { result } = setup();
    act(() => { result.current.addItem(apple, 1); });
    act(() => { result.current.addItem(apple, 2); });
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(3);
  });

  it("rejects adding more than the stock on hand", () => {
    const { result } = setup();
    let err;
    act(() => { err = result.current.addItem(apple, 6); });
    expect(err).toMatch(/Not enough stock/);
    expect(result.current.cart).toHaveLength(0);
  });

  it("rejects exceeding stock across multiple adds", () => {
    const { result } = setup();
    act(() => { result.current.addItem(apple, 4); });
    let err;
    act(() => { err = result.current.addItem(apple, 2); });
    expect(err).toMatch(/Not enough stock/);
    expect(result.current.cart[0].quantity).toBe(4);
  });

  it("does not tax tax-exempt items", () => {
    const { result } = setup();
    act(() => { result.current.addItem(bread, 1); });
    expect(result.current.totals.tax).toBe(0);
    expect(result.current.totals.grand).toBe(20);
  });

  it("flags price overrides and sends unitPrice only for them", () => {
    const { result } = setup();
    act(() => { result.current.addItem(apple, 1, 8); });
    act(() => { result.current.addItem(bread, 1); });
    const items = result.current.toOrderItems();
    expect(items.find((i) => i.productId === 1).unitPrice).toBe(8);
    expect(items.find((i) => i.productId === 2).unitPrice).toBeNull();
  });

  it("removes a line when quantity drops to zero", () => {
    const { result } = setup();
    act(() => { result.current.addItem(apple, 1); });
    act(() => { result.current.changeQty(1, -1); });
    expect(result.current.cart).toHaveLength(0);
  });

  it("clears the cart", () => {
    const { result } = setup();
    act(() => { result.current.addItem(apple, 1); });
    act(() => { result.current.clear(); });
    expect(result.current.cart).toHaveLength(0);
    expect(result.current.selected).toBeNull();
  });
});