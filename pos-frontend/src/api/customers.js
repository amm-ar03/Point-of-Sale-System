import { http, jsonBody } from "./client";

export const getCustomers = () => http("/customers");
export const createCustomer = (c) => http("/customers", jsonBody("POST", c));
export const updateCustomer = (id, c) => http(`/customers/${id}`, jsonBody("PUT", c));
export const deleteCustomer = (id) => http(`/customers/${id}`, { method: "DELETE" });