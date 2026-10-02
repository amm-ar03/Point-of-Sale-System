// src/api/products.js
import { http, jsonBody } from "./client";

export const getProducts = () => http("/products");
export const getProductBySku = (sku) => http(`/products/sku/${encodeURIComponent(sku)}`);
export const createProduct = (p) => http("/products", jsonBody("POST", p));
export const deleteProduct = (id) => http(`/products/${id}`, { method: "DELETE" });