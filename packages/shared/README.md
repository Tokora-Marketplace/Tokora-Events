# Tokora Shared Package

## Overview

The `shared` package contains code that is consumed by both the frontend and backend.

Its primary purpose is to ensure both applications use the same contracts, reducing duplication and preventing inconsistencies.

---

# Responsibilities

This package should contain only code that is shared across multiple applications.

Examples include:

* TypeScript interfaces
* DTOs
* Shared enums
* Request types
* Response types
* Validation schemas (when appropriate)
* Constants shared between applications

---

# Repository Structure

```text
packages/shared/
├── src/
│   ├── dto/
│   ├── enums/
│   ├── interfaces/
│   ├── types/
│   ├── constants/
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

# What Belongs Here

Examples

```text
Event
Ticket
Attendance
Payment
User
Auth
Pagination
ApiResponse<T>
Wallet
Role
Permission
```

Shared enums

```text
TicketStatus
PaymentStatus
EventStatus
AttendanceStatus
UserRole
```

Shared DTOs

```text
CreateEventDto
UpdateEventDto
PurchaseTicketDto
LoginResponse
PaymentResponse
```

---

# What Must NOT Be Stored Here

Never place application logic inside this package.

Do NOT include:

* Controllers
* Services
* Routes
* Database code
* Prisma models
* Redis code
* Fastify plugins
* React components
* Next.js pages
* Solana business logic

This package exists only for shared contracts.

---

# Example

Instead of defining

```ts
interface Event
```

inside both frontend and backend,

define it once inside

```text
packages/shared/src/interfaces/Event.ts
```

and import it from both applications.

---

# Importing

Backend

```ts
import { Event } from "@tokora/shared";
```

Frontend

```ts
import { Event } from "@tokora/shared";
```

Both applications should reference the exact same definition.

---

# Versioning Rules

Whenever a shared type changes:

1. Update the type.
2. Update backend implementation.
3. Update frontend implementation.
4. Verify both applications compile.
5. Update documentation.

Never update one side without the other.

---

# Breaking Changes

Breaking changes include:

* Removing fields
* Renaming fields
* Changing data types
* Changing enums
* Modifying request payloads
* Modifying response payloads

Breaking changes must be communicated to all contributors before being merged.

---

# Naming Conventions

Interfaces

```text
Event
Ticket
User
Payment
```

DTOs

```text
CreateEventDto
UpdateEventDto
PurchaseTicketDto
```

Enums

```text
EventStatus
TicketStatus
PaymentStatus
```

Generic Responses

```text
ApiResponse<T>
PaginatedResponse<T>
```

---

# Documentation Policy

Whenever shared contracts change, update this package documentation.

If a new shared folder is introduced, document:

* Purpose
* Contents
* Usage

Documentation must always reflect the current implementation.

---

# Goal

The shared package is the single source of truth for all data exchanged between the frontend and backend.

Duplicating types across applications is discouraged.

All shared contracts should originate from this package to ensure consistency, maintainability, and type safety across the entire monorepo.
