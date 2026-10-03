// src/hooks/useProducts.js
import { useCallback, useState } from "react";
import * as productsApi from "../api/products";

export function useProducts(notify) {
  const [products, setProducts] = useState([]);

  const refresh = useCallback(async () => {
    const list = await productsApi.getProducts();
    setProducts(list);
    return list;
  }, []);

  const stockOf = (id) => products.find((p) => p.id === id)?.stockQuantity ?? 0;

  async function add(payload) {
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

  async function remove(id) {
    try {
      await productsApi.deleteProduct(id);
      setProducts((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      notify(e.message);
    }
  }

  function search(term) {
    const t = term.toLowerCase();
    return products.find((p) => p.name.toLowerCase().includes(t) || p.sku?.toLowerCase().includes(t)) ?? null;
  }

  return { products, setProducts, refresh, stockOf, add, remove, search };
}