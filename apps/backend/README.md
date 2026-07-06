# Tokora Backend

## Overview

The Tokora backend powers the Tokora decentralized event platform.

It provides:

* Authentication
* Event management
* Ticket issuance
* Attendance verification
* Payment processing
* Solana blockchain integration
* Background workers
* Queue processing

The backend is built with **Fastify**, **TypeScript**, **Prisma**, **PostgreSQL**, **Redis**, **BullMQ**, and **Solana Web3.js**.

---

# Repository Structure

```text
apps/backend/
├── prisma/                 # Database schema & migrations
├── src/
│   ├── blockchain/         # Solana RPC client
│   ├── cache/              # Redis connection
│   ├── config/             # Environment & logging
│   ├── db/                 # Prisma client
│   ├── events/
│   ├── modules/
│   │   ├── auth/
│   │   ├── attendance/
│   │   ├── events/
│   │   ├── payments/
│   │   └── tickets/
│   ├── queues/
│   ├── webhooks/
│   ├── workers/
│   └── server.ts
├── tests/
├── package.json
└── README.md
```

---

# Technology Stack

* Fastify
* TypeScript
* Prisma ORM
* PostgreSQL
* Redis
* BullMQ
* Solana Web3.js
* JWT Authentication
* Google OAuth

---

# Development Environment

Backend Port

```text
4000
```

Health Check

```text
GET /health
```

The backend must successfully connect to:

* PostgreSQL
* Redis
* Solana RPC

before accepting requests.

---

# Installation

From the repository root

```bash
npm install
```

Run only the backend

```bash
npm run dev:backend
```

Or from this directory

```bash
npm run dev
```

---

# Environment Variables

Create

```text
apps/backend/.env
```

using

```text
apps/backend/.env.example
```

Required configuration includes:

* PORT
* DATABASE_URL
* REDIS_URL
* JWT_SECRET
* JWT_EXPIRES_IN
* SOLANA_NETWORK
* SOLANA_RPC_URL
* GOOGLE_CLIENT_ID
* GOOGLE_CLIENT_SECRET
* GOOGLE_CALLBACK_URL

Never commit `.env`.

---

# Startup Process

During startup the server performs the following checks:

1. Load environment variables.
2. Connect to PostgreSQL.
3. Connect to Redis.
4. Verify Solana RPC connectivity.
5. Register authentication.
6. Register API modules.
7. Start background workers.
8. Listen for incoming requests.

The server should not start unless all required infrastructure is available.

---

# Current API Modules

## Authentication

Responsible for:

* Google OAuth
* JWT Authentication
* Session management

---

## Events

Responsible for:

* Create event
* Update event
* Close event
* Retrieve events
* Organizer event management

---

## Tickets

Responsible for:

* Ticket issuance
* Ticket lookup
* Attendee retrieval

---

## Attendance

Responsible for:

* QR verification
* Attendance history
* Event attendance records

---

## Payments

Responsible for:

* Payment recording
* Transaction lookup
* Webhook handling
* Verification

---

# Background Workers

The backend currently starts several BullMQ workers.

These workers process asynchronous jobs outside the request lifecycle.

Current workers include:

* Reputation Worker
* Notification Worker
* Giveaway Worker
* Upload Metadata Worker
* NFT Mint Worker

Workers should remain independent from HTTP request handlers.

---

# Redis

Redis is used for:

* Queue processing
* Worker communication
* Caching
* Background jobs

Redis must be available before the server starts.

---

# PostgreSQL

Database access is managed through Prisma.

Schema

```text
prisma/schema.prisma
```

Generate Prisma client

```bash
npm run db:generate
```

Create migration

```bash
npm run db:migrate
```

Launch Prisma Studio

```bash
npm run db:studio
```

Do not edit generated Prisma files manually.

---

# Solana Integration

Blockchain communication is handled through

```text
src/blockchain/
```

Configuration is provided through

```text
SOLANA_RPC_URL
```

Current network

```text
Devnet
```

The backend verifies RPC connectivity during startup.

If RPC verification fails, startup is aborted.

---

# API Development Guidelines

Every new module should follow the existing project structure.

Example

```text
module/
├── controller
├── routes
├── service
├── repository (optional)
├── validation
└── types
```

Business logic should remain inside services.

Routes should remain thin.

---

# Shared Types

Frontend and backend contracts belong in

```text
packages/shared
```

Do not duplicate DTOs between frontend and backend.

Whenever an API request or response changes:

1. Update the backend.
2. Update the shared type.
3. Notify frontend developers.
4. Update documentation.

---

# Logging

The project uses structured logging.

Avoid:

* console.log
* console.error

Use the project logger instead.

All unexpected failures should produce useful logs.

---

# Error Handling

Every endpoint should:

* Validate input.
* Return appropriate HTTP status codes.
* Return structured JSON errors.
* Avoid exposing internal implementation details.

---

# Testing Checklist

Before pushing code:

* Backend starts successfully.
* PostgreSQL connects.
* Redis connects.
* Solana RPC connects.
* Health endpoint returns 200.
* New endpoints tested locally.
* Existing endpoints still function.
* No TypeScript errors.
* No linting errors.

---

# Collaboration Rules

Before changing:

* API contracts
* Database schema
* Authentication
* Queue architecture
* Worker behavior
* Shared types

notify the frontend developer if the change affects integration.

Breaking API changes must never be introduced silently.

---

# Documentation Policy

This README is considered part of the backend codebase.

It **must** be updated whenever changes are made to:

* Folder structure
* Architecture
* Environment variables
* Database schema
* Queue system
* Workers
* API modules
* Authentication
* Deployment process
* Startup process
* Build process
* Infrastructure
* New dependencies

Documentation should always reflect the current implementation.

---

# Git Workflow

Before committing

```bash
git status
```

Review staged files carefully.

Do **not** commit:

* node_modules/
* dist/
* .env
* generated artifacts
* temporary files

Use descriptive commit messages.

Examples

```text
feat(backend): implement ticket verification

fix(backend): resolve Redis connection issue

refactor(backend): extract payment service

docs(backend): update API documentation
```

---

# Long-Term Architecture

The backend should remain:

* Modular
* Type-safe
* Well documented
* Testable
* Event-driven
* Scalable

Business logic should remain independent of the frontend, and API contracts should be maintained through `packages/shared`.

Any architectural or infrastructure changes must be documented before being merged into the main branch.
