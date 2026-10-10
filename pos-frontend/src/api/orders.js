// src/api/orders.js
import { http, jsonBody } from "./client";

//export const createOrder = (items) => http("/orders", jsonBody("POST", { items }));
export const getOrders = () => http("/orders");
export const getDrafts = () => http("/orders/drafts");
export const saveDraft = (id, data) =>
  id ? http(`/orders/drafts/${id}`, jsonBody("PUT", data)) : http("/orders/drafts", jsonBody("POST", data));
export const getOrdersByCustomer = (id) => http(`/orders/by-customer/${id}`);
export const createOrder = (items, extra = {}) =>
  http("/orders", jsonBody("POST", { items, ...extra }));
export const payDraft = (id) => http(`/orders/drafts/${id}/pay`, { method: "POST" });
export const deleteDraft = (id) => http(`/orders/drafts/${id}`, { method: "DELETE" });