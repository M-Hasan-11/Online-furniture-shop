# Online Furniture Shop (Full Stack)

A complete furniture e-commerce app with a React frontend and Express + SQLite backend.

## Stack
- Frontend: React, Vite, TypeScript, React Router, Axios
- Backend: Node.js, Express, SQLite (better-sqlite3), JWT auth

## Features
- Beautiful responsive storefront with curated furniture catalog
- Product search, category filters, sort options
- Product detail pages with quantity selector
- Product reviews and rating updates
- Wishlist saving (guest + account sync)
- Personalized recommendations
- Cart with local persistence
- User registration/login with JWT
- Protected checkout flow
- Coupon validation and discounted checkout totals
- Order creation with subtotal/shipping/discount breakdown and account order history
- Admin dashboard with KPIs, order status management, catalog CRUD, and coupon CRUD
- Seeded product data (12 furniture items)

## Project Structure
- `client/`: React frontend
- `server/`: Express API + SQLite database

## Quick Start
1. Install dependencies
```bash
npm install
npm install --prefix client
npm install --prefix server
```

2. (Optional) configure env
- Copy `server/.env.example` to `server/.env`
- Copy `client/.env.example` to `client/.env`

3. Run both apps
```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:5000`

## Admin Access
- Admin route: `http://localhost:5173/admin`
- Default admin login:
  - Email: `admin@atelierfurnish.com`
  - Password: `admin123`
- Override admin credentials in `server/.env` using `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
- Admin capabilities:
  - View revenue and store KPIs
  - Update order status
  - Create, edit, and delete products (delete is blocked for products used in past orders)
  - Create, activate/deactivate, and delete coupons

## Scripts
- `npm run dev`: run client + server together
- `npm run dev:client`: run frontend only
- `npm run dev:server`: run backend only
- `npm run build`: production build of frontend
- `npm run start`: run backend in production mode

## API Overview
Base URL: `/api`

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token)
- `GET /products`
- `GET /products/:id`
- `GET /products/:id/reviews`
- `POST /products/:id/reviews` (Bearer token)
- `GET /wishlist` (Bearer token)
- `POST /wishlist/:productId` (Bearer token)
- `DELETE /wishlist/:productId` (Bearer token)
- `GET /recommendations` (optional auth)
- `GET /coupons/validate?code=...&subtotal=...`
- `POST /orders` (Bearer token)
- `GET /orders` (Bearer token)
- `GET /admin/summary` (Admin)
- `GET /admin/orders` (Admin)
- `PATCH /admin/orders/:id/status` (Admin)
- `GET /admin/products` (Admin)
- `POST /admin/products` (Admin)
- `PATCH /admin/products/:id` (Admin)
- `DELETE /admin/products/:id` (Admin)
- `GET /admin/coupons` (Admin)
- `POST /admin/coupons` (Admin)
- `PATCH /admin/coupons/:id` (Admin)
- `DELETE /admin/coupons/:id` (Admin)

## Notes
- SQLite DB file is created at `server/furniture.sqlite`.
- Product images are loaded from Pexels URLs.
- For production, set a strong `JWT_SECRET` in `server/.env`.
