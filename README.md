# Mini ERP + CRM Operations Portal

A small internal ERP/CRM system for a wholesale/distribution company: customers, products,
stock, and sales challans, with role-based access for Admin, Sales, Warehouse, and Accounts
users.

## Tech stack

- **Backend:** Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, JWT auth, Zod validation
- **Frontend:** React 18, TypeScript, Vite, React Router (no UI framework — hand-rolled admin styling)
- **Deployment target:** Render/Railway/Fly.io (backend), Vercel/Netlify (frontend), Supabase/Neon/Render Postgres (database). AWS is optional/bonus per the brief.

## Repository layout

```
mini-erp-crm/
├── backend/               Express API (TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma  Database schema
│   │   └── seed.ts        Creates one demo login per role + sample data
│   └── src/
│       ├── config/        Prisma client singleton
│       ├── controllers/   Route handlers (business logic)
│       ├── middleware/    Auth, validation, error handling
│       ├── routes/        Express routers
│       ├── validators/    Zod schemas
│       └── index.ts       App entry point
├── frontend/               React admin UI (Vite + TypeScript)
│   └── src/
│       ├── api/           Fetch client with JWT attach
│       ├── context/       Auth context
│       ├── components/    Layout, Badge, ProtectedRoute
│       └── pages/         Login, Dashboard, Customers, Products, Challans
├── docker-compose.yml      Local PostgreSQL for development
└── postman_collection.json API collection covering every endpoint
```

## Architecture, in brief

The backend is a fairly standard layered Express app: routes → validators (Zod) → controllers →
Prisma → PostgreSQL. Auth is stateless JWT with the role embedded in the token payload; a small
`authorize(...)` middleware gate-keeps each route by role.

The one piece of real business logic is the **sales challan → stock** relationship:

- A challan is always created in the database as `DRAFT` first. If the request asked for it to be
  `CONFIRMED` immediately, the same DB transaction that created it also deducts stock — so a
  challan is never left half-confirmed.
- Stock deduction and restocking both run inside a Prisma `$transaction`. If any line item would
  push a product's `currentStock` below zero, the whole transaction throws and rolls back — no
  partial stock changes, and the API returns a `400` naming the product and the shortfall.
- Every `ChallanItem` stores a **snapshot** of the product's name, SKU, and unit price at the time
  it was added, so editing or re-pricing a product later doesn't rewrite historical challans.
- Cancelling a `CONFIRMED` challan restocks the products (with an audit `StockMovement` row);
  cancelling a `DRAFT` challan does not touch stock, since none was ever deducted.
- Manual stock adjustments (`POST /products/:id/stock-movements`) go through the same
  never-negative check and share the movement-log table with challan-driven changes, so the log
  is a complete audit trail regardless of source.

## Local setup

### Prerequisites
- Node.js 18+
- Docker (for local Postgres) — or any Postgres 14+ instance you already have

### 1. Database
```bash
docker compose up -d
```
This starts Postgres on `localhost:5432` with user/password `postgres`/`postgres` and database
`mini_erp_crm` (see `docker-compose.yml`). If you'd rather use an existing Postgres instance,
skip this and just point `DATABASE_URL` at it.

### 2. Backend
```bash
cd backend
cp .env.example .env      # edit DATABASE_URL / JWT_SECRET if needed
npm install
npx prisma migrate dev --name init
npm run seed               # creates demo users + sample products/customer
npm run dev                 # starts on http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env       # VITE_API_URL should point at the backend
npm install
npm run dev                 # starts on http://localhost:5173
```

### Demo logins (created by the seed script)
All use password `Password123!`:

| Role      | Email               |
|-----------|---------------------|
| Admin     | admin@demo.com      |
| Sales     | sales@demo.com      |
| Warehouse | warehouse@demo.com  |
| Accounts  | accounts@demo.com   |

## Environment variables

**Backend (`backend/.env`)**
| Variable       | Purpose                                              |
|----------------|-------------------------------------------------------|
| `DATABASE_URL` | Postgres connection string                            |
| `JWT_SECRET`   | Secret used to sign/verify JWTs — use a long random value in production |
| `PORT`         | Port the API listens on (default `4000`)              |
| `CORS_ORIGIN`  | Comma-separated list of allowed frontend origins       |

**Frontend (`frontend/.env`)**
| Variable        | Purpose                          |
|-----------------|-----------------------------------|
| `VITE_API_URL`  | Base URL of the backend API       |

## Deployment

The brief treats free-tier deployment as sufficient (AWS is a bonus, not required).

**Suggested path:**
1. **Database:** create a free Postgres instance on Supabase, Neon, or Render Postgres. Copy its
   connection string into `DATABASE_URL`.
2. **Backend:** deploy `backend/` to Render or Railway as a Node web service.
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npm run prisma:deploy && npm start` (runs pending migrations, then starts the server)
   - Set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (your frontend URL) as environment variables
   - After first deploy, run the seed script once via the platform's shell/console: `npm run seed`
3. **Frontend:** deploy `frontend/` to Vercel or Netlify.
   - Build command: `npm run build`, output directory: `dist`
   - Set `VITE_API_URL` to your deployed backend URL

### AWS (bonus, optional)
The same containers/build artifacts can run on AWS instead: backend as an Elastic Beanstalk app
or a small EC2 instance behind an ALB, frontend as a static S3 bucket + CloudFront, database as
RDS PostgreSQL. This wasn't required for the assignment scope and hasn't been set up here — happy
to add Elastic Beanstalk/Dockerfile config if useful.

## API overview

All endpoints except `/auth/login` and `/health` require `Authorization: Bearer <token>`.
Full request/response examples are in `postman_collection.json`.

| Method | Path                              | Roles allowed              | Notes |
|--------|------------------------------------|-----------------------------|-------|
| POST   | `/auth/login`                      | public                      | |
| POST   | `/auth/register`                   | ADMIN                       | Create additional users |
| GET    | `/auth/me`                          | any authenticated           | |
| GET    | `/customers`                        | any authenticated           | Search, filter, pagination |
| POST   | `/customers`                        | ADMIN, SALES                | |
| GET    | `/customers/:id`                    | any authenticated           | Includes follow-ups + recent challans |
| PUT    | `/customers/:id`                    | ADMIN, SALES                | |
| POST   | `/customers/:id/follow-ups`         | ADMIN, SALES                | |
| GET    | `/products`                         | any authenticated           | Search, `lowStock=true` filter, pagination |
| POST   | `/products`                         | ADMIN, WAREHOUSE            | |
| GET    | `/products/:id`                     | any authenticated           | Includes stock movement log |
| PUT    | `/products/:id`                     | ADMIN, WAREHOUSE            | |
| POST   | `/products/:id/stock-movements`     | ADMIN, WAREHOUSE            | Manual IN/OUT adjustment |
| GET    | `/challans`                         | any authenticated           | Filter by status/customer, pagination |
| POST   | `/challans`                         | ADMIN, SALES                | Draft or confirm-on-create |
| GET    | `/challans/:id`                     | any authenticated           | |
| PATCH  | `/challans/:id/status`              | ADMIN, SALES, WAREHOUSE     | DRAFT→CONFIRMED or →CANCELLED |

## Assumptions made

- **Role split:** Customer records are managed by Sales/Admin; product catalog and stock by
  Warehouse/Admin; anyone logged in can *view* customers, products, and challans (useful for
  Accounts). Challan status changes are allowed by Sales, Warehouse, or Admin, since either sales
  (confirming an order) or warehouse (fulfilling it) plausibly triggers that transition.
- **Challan numbering:** sequential per calendar year (`CH-2026-0001`, `CH-2026-0002`, …).
- **Cancelling a confirmed challan restocks the items.** The brief didn't specify this, but leaving
  stock permanently deducted for a cancelled order would be incorrect from a business standpoint,
  so cancellation reverses the deduction and logs it as an `IN` movement for audit purposes.
- **GST number, email, category, location** etc. are optional fields; only the fields the brief
  marked as required (or that are structurally necessary, like mobile number) are enforced.
- **No invoice generation** was implemented — the brief lists "Export invoice as PDF" as a bonus
  item, and it's out of scope for this pass.

## Known limitations / not yet done

- No automated test suite (unit/integration tests) — given the time box, manual verification via
  the Postman collection was prioritized over test scaffolding.
- No Docker setup for the backend/frontend themselves (only Postgres) — bonus item, not done.
- No CI/CD (GitHub Actions) — bonus item, not done.
- No product image upload to S3 — bonus item, not done.
- Low-stock filtering on `GET /products?lowStock=true` is done in-application rather than in SQL,
  since it compares two columns (`currentStock <= minStockAlertQty`) and the product list is
  expected to stay small for this use case. For a much larger catalog this should move to a raw
  SQL/`$queryRaw` comparison instead.
- Frontend has no automated tests and hasn't been run end-to-end in this environment (no network
  access to install npm packages here) — see "Verifying locally" below before relying on it.

## Verifying locally

This was built and reviewed carefully, but the sandbox this was written in has no network access
to run `npm install`, so it hasn't been compiled or run end-to-end. Before submitting:

```bash
cd backend && npm install && npx tsc --noEmit   # confirms the backend compiles
cd ../frontend && npm install && npm run build    # confirms the frontend compiles
```

Then follow the "Local setup" steps above to run both and click through: log in as each role,
add a customer, add a product, create a draft challan, confirm it (watch stock drop), try to
over-sell a product (should get a clean 400 error), and cancel a confirmed challan (watch stock
restore).
