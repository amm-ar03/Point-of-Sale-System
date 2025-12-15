# POS System

Full-stack Point of Sale system built with:
- Java 21 / Spring Boot (backend)
- React (frontend with Vite)
- H2 (dev database)

## Structure

- `pos-backend/` – Spring Boot API (`/api/products`, `/api/orders`, etc.)
- `pos-frontend/` – React UI (cart, SKU search, tax, Pay button)

## Running locally

1. Backend:
   - `cd pos-backend`
   - `mvn spring-boot:run`

2. Frontend:
   - `cd pos-frontend`
   - `npm install`
   - `npm run dev`
