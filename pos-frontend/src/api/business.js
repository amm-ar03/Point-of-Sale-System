import { http, jsonBody } from "./client";

export const getBusiness = () => http("/business");
export const saveBusiness = (b) => http("/business", jsonBody("PUT", b));