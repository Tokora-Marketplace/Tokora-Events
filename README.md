# Tokora

Decentralized event infrastructure built on Solana.

This repository is organized as a monorepo containing the backend API, frontend application, and shared packages used across the project.

---

# Repository Structure

```
Tokora-Events/
├── apps/
│   ├── backend/          # Fastify + TypeScript backend
│   └── frontend/         # Next.js frontend
│
├── packages/
│   └── shared/           # Shared types/interfaces (used by both apps)
│
├── package.json          # Root workspace configuration
└── README.md
```

---

# Tech Stack

## Backend

* Fastify
* TypeScript
* Prisma
* PostgreSQL
* Redis
* Solana Web3.js
* BullMQ

## Frontend

* Next.js
* React
* TypeScript
* Axios

---

# Development Ports

| Service  | Port |
| -------- | ---- |
| Frontend | 3000 |
| Backend  | 4000 |

---

# Requirements

* Node.js 20+
* npm
* PostgreSQL
* Redis
* Solana RPC endpoint (Helius Devnet or equivalent)

---

# Installation

Clone the repository

```bash
git clone <repository-url>
cd Tokora-Events
```

Install all workspace dependencies

```bash
npm install
```

---

# Running the Project

Start both applications

```bash
npm run dev
```

Run frontend only

```bash
npm run dev:frontend
```

Run backend only

```bash
npm run dev:backend
```

---

# Environment Variables

## Backend

Create

```
apps/backend/.env
```

using

```
apps/backend/.env.example
```

Required services include:

* PostgreSQL
* Redis
* Solana RPC
* Google OAuth credentials
* JWT Secret

---

## Frontend

Create

```
apps/frontend/.env.local
```

Example

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

The frontend should communicate with the backend exclusively through this environment variable.

---

# Backend Health Check

Verify the backend is running

```bash
curl http://localhost:4000/health
```

Expected response

```json
{
  "status": "ok",
  "service": "tokora-backend"
}
```

---

# Current API Endpoints

## Health

| Method | Endpoint | Auth |
| ------ | -------- | ---- |
| GET    | /health  | No   |

---

## Authentication

| Method | Endpoint              | Auth |
| ------ | --------------------- | ---- |
| GET    | /auth/google          | No   |
| GET    | /auth/google/callback | No   |
| POST   | /auth/refresh         | No   |
| POST   | /auth/logout          | Yes  |
| GET    | /auth/me              | Yes  |

---

## Events

| Method | Endpoint            | Auth |
| ------ | ------------------- | ---- |
| GET    | /events             | No   |
| GET    | /events/:id         | No   |
| GET    | /events/my          | Yes  |
| POST   | /events             | Yes  |
| PATCH  | /events/:id         | Yes  |
| PATCH  | /events/:id/handler | Yes  |
| POST   | /events/:id/close   | Yes  |

---

## Tickets

| Method | Endpoint              | Auth |
| ------ | --------------------- | ---- |
| POST   | /tickets              | Yes  |
| GET    | /tickets              | Yes  |
| GET    | /tickets/:id          | Yes  |
| GET    | /events/:id/attendees | Yes  |

---

## Attendance

| Method | Endpoint                  | Auth |
| ------ | ------------------------- | ---- |
| POST   | /attendance/load/:eventId | Yes  |
| POST   | /attendance/scan          | No   |
| GET    | /attendance/history       | Yes  |
| GET    | /attendance/:eventId      | Yes  |
| GET    | /events/:id/attendances   | Yes  |

---

## Payments

| Method | Endpoint                 | Auth |
| ------ | ------------------------ | ---- |
| POST   | /webhooks/helius         | No   |
| POST   | /payments/record         | Yes  |
| GET    | /payments                | Yes  |
| GET    | /payments/:id            | Yes  |
| GET    | /events/:id/transactions | Yes  |
| POST   | /payments/verify         | Yes  |

---

# Frontend Integration Notes

The frontend developer should:

1. Configure `NEXT_PUBLIC_API_URL=http://localhost:4000`.
2. Use the centralized Axios client located at:

```
apps/frontend/src/lib/api.ts
```

3. Replace placeholder API calls with requests through the shared API client.
4. Report any endpoint mismatches, payload mismatches, validation issues, authentication issues, or CORS issues during integration.

---

# Shared Package

```
packages/shared
```

This package is reserved for shared contracts between frontend and backend.

Examples include:

* DTOs
* Interfaces
* Shared enums
* Response types

Business logic, controllers, services, and database code should remain inside the backend.

---

# Git Workflow

Before committing, ensure generated files are not included.

Do **not** commit:

* node_modules/
* .env
* .next/
* dist/

Review changes before every commit

```bash
git status
```

---

# Monorepo Notes

The backend has been migrated into the workspace structure and now runs on port **4000**.

The frontend runs independently on port **3000**.

Both applications can be started together from the repository root using:

```bash
npm run dev
```
