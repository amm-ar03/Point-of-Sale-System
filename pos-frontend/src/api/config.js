// src/api/config.js
import { http } from "./client";

export const getConfig = () => http("/config");