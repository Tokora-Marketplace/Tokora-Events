# Tokora Frontend

## Overview

This directory contains the **Tokora Frontend**, built with **Next.js**, **React**, and **TypeScript**.

The frontend communicates with the backend through HTTP APIs exposed by the Fastify backend running inside the same monorepo.

Repository Structure

```
apps/
└── frontend/
    ├── src/
    ├── public/
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

---

# Development Environment

## Required Software

* Node.js 20+
* npm

The backend must also be running locally.

Backend URL

```
http://localhost:4000
```

Frontend URL

```
http://localhost:3000
```

---

# Installation

From the repository root

```
npm install
```

Run only the frontend

```
npm run dev:frontend
```

Or from this directory

```
npm run dev
```

---

# Environment Variables

Create

```
apps/frontend/.env.local
```

Example

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Never hardcode URLs.

Always reference

```typescript
process.env.NEXT_PUBLIC_API_URL
```

---

# Backend Integration

The backend already runs on

```
http://localhost:4000
```

A shared Axios client should be used for **every** request.

Location

```
src/lib/api.ts
```

Example

```ts
import { api } from "@/lib/api";

const res = await api.get("/events");
```

Do not call

```ts
fetch("http://localhost:4000/...")
```

or

```ts
axios.get("http://localhost:4000/...")
```

directly throughout the project.

Always use the shared API client.

---

# Current Backend Status

The backend is operational and has been verified.

Health endpoint

```
GET /health
```

returns

```json
{
  "status": "ok"
}
```

The backend currently provides modules for:

* Authentication
* Events
* Tickets
* Attendance
* Payments

Any integration issues should be reported with:

* endpoint
* request payload
* response
* HTTP status code

---

# API Integration Checklist

Before opening a Pull Request verify:

* Every API call uses the shared API client.
* No hardcoded localhost URLs exist.
* All forms correctly handle loading states.
* API failures display useful error messages.
* Authentication tokens are handled consistently.
* Environment variables are used instead of constants.

---

# Shared Types

Shared interfaces belong in

```
packages/shared
```

Do **not** duplicate backend interfaces inside the frontend.

If a backend response changes:

1. Update the shared type.
2. Update frontend usage.
3. Update backend usage.
4. Document the change.

---

# Folder Responsibilities

```
src/app/
```

Application routes.

```
src/components/
```

Reusable UI components.

```
src/lib/
```

Shared utilities.

Examples:

* Axios client
* Helpers
* Formatters

---

# Collaboration Rules

Before changing an API contract:

* notify the backend developer.

If an endpoint changes:

* update the frontend.
* update shared types.
* update documentation.

Do not silently change request or response shapes.

---

# Pull Request Checklist

Before pushing:

* npm run lint
* Verify the application builds.
* Test affected pages.
* Remove unused code.
* Remove debugging statements.
* Remove console.log statements.

---

# Documentation Policy

This README is considered part of the project documentation.

It **must** be updated whenever one or more of the following changes occur:

* Folder structure
* Build process
* Installation steps
* Environment variables
* API integration process
* Routing
* Authentication flow
* Shared types
* New dependencies
* Development workflow
* State management
* Project architecture

Documentation should always reflect the current state of the project.

---

# Communication With Backend

If backend integration fails, provide the backend developer with:

* Endpoint
* HTTP method
* Request body
* Response body
* Status code
* Browser console errors
* Network request screenshot (if applicable)

Avoid making backend assumptions without confirming the API contract.

---

# Git Workflow

Before committing

```
git status
```

Review all staged files.

Do not commit:

* node_modules
* .next
* .env.local
* generated files
* temporary files

Use descriptive commit messages.

Examples

```
feat(frontend): integrate event listing API

fix(frontend): correct authentication flow

refactor(frontend): move API client into shared lib

docs(frontend): update integration guide
```

---

# Goal

The frontend should remain:

* modular
* maintainable
* type-safe
* documented
* synchronized with the backend

Any architectural or workflow changes must be reflected in this README before they are merged into the main branch.
