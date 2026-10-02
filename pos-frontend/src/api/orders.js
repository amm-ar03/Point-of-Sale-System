// src/api/orders.js
import { http, jsonBody } from "./client";

export const createOrder = (items) => http("/orders", jsonBody("POST", { items }));
export const getOrders = () => http("/orders");