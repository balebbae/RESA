# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RESA (Restaurant Employee Scheduling Application) is a full-stack monorepo with a Go backend and Next.js frontend. The backend is complete; the frontend is under development.

**Tech Stack:**
- Backend: Go 1.23.1 with Chi router, PostgreSQL (no ORM), Redis caching
- Frontend: Next.js 15.5.5 with React 19, TypeScript, Tailwind CSS 4, ShadCN UI
- Authentication: JWT tokens + Magic Links (passwordless)
- External Services: SendGrid (email)

## Development Commands

### Backend (from `/backend`)

```bash
# Start development server with hot reload (uses Air)
air

# Build the application
go build -o ./bin/main ./cmd/api

# Run tests
make test
# or
go test -v ./...

# Database migrations
make migrate-up         # Run all pending migrations
make migrate-down       # Rollback last migration
make migrate-create <name>  # Create new migration file

# Seed database with test data
make seed

# Generate Swagger API documentation
make gen-docs
```

**Environment Setup:** The backend requires a `.env` file in `/backend`. Reference `backend/cmd/api/main.go:48-88` for required variables (DB_ADDR, REDIS_ADDR, SENDGRID_API_KEY, AUTH_TOKEN_SECRET, etc.).

**Database:** PostgreSQL connection string defaults to `postgres://admin:adminpassword@localhost:5432/resa?sslmode=disable`. Use Docker Compose: `docker-compose up -d` from `/backend`.

### Frontend (from `/frontend`)

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

**Environment Setup:** Frontend requires `NEXT_PUBLIC_API_URL` environment variable to connect to the backend API (see `frontend/lib/api.ts:2-4`).

## Architecture

### Backend Architecture (Clean Architecture / Repository Pattern)

```
backend/
├── cmd/
│   ├── api/           # HTTP handlers, middleware, routing, server setup
│   └── migrate/       # Database migrations (SQL files)
├── internal/
│   ├── store/         # Data access layer (repository pattern)
│   │   ├── cache/     # Redis caching implementations
│   │   ├── *.go       # Entity-specific stores (user, restaurant, etc.)
│   │   └── storage.go # Storage interface definitions
│   ├── auth/          # JWT authentication logic
│   ├── mailer/        # SendGrid email integration
│   ├── db/            # Database connection setup
│   ├── env/           # Environment variable utilities
│   └── ratelimiter/   # Rate limiting implementation
└── docs/              # Swagger documentation (auto-generated)
```

**Key Patterns:**

1. **Storage Layer** (`internal/store/storage.go:17-86`): Interface-based repository pattern with dedicated stores for each entity (Users, Restaurants, Employees, Roles, ShiftTemplates, Schedules, ScheduledShifts). All database operations go through these interfaces.

2. **Redis Caching** (`internal/store/cache/`): Optional Redis caching for restaurants and schedules. Enabled via `REDIS_ENABLED` env var. Cache invalidation happens automatically on updates.

3. **User Creation Saga** (README.md:42-50): Multi-step user registration with magic link verification:
   - User Registration → Email Verification → Account Activation → Profile Completion
   - Each step must complete before proceeding; includes compensation for failures

4. **Magic Links** (README.md:52-60): Passwordless authentication using time-limited JWT tokens sent via SendGrid.

5. **No ORM**: Raw SQL queries throughout. Use `context.Context` for all database operations with 5-second timeout (see `store.QueryTimeoutDuration`).

### Frontend Architecture (Next.js App Router)

```
frontend/
├── app/
│   ├── (resa)/        # Authenticated routes (route group)
│   │   ├── home/
│   │   ├── calendar/
│   │   ├── settings/
│   │   └── onboard/
│   ├── login/         # Login page
│   ├── signup/        # Sign up page
│   ├── confirm/       # Magic link confirmation
│   └── dashboard/     # Dashboard (legacy/migration?)
├── components/
│   ├── ui/            # ShadCN UI components (56 components)
│   ├── marketing/     # Marketing page components
│   └── resa/          # Application-specific components
└── lib/
    ├── api.ts         # API base URL configuration
    └── utils.ts       # Utility functions
```

**Routing:** Uses Next.js 15 App Router with route groups. `(resa)` group likely contains authenticated routes requiring login.

**UI Components:** Built with ShadCN UI + Radix UI primitives. Import from `@/components/ui/*`.

**Styling:** Tailwind CSS 4 with custom animations via `tw-animate-css`.

## Database Schema

Key entities (see backend/README.md:70-80 for details):
- **users** - Application users (owners and employees)
- **restaurants** - Restaurant info and ownership
- **roles** - Employee positions within restaurants
- **employees** - Employee records per restaurant
- **schedules** - Weekly work schedules
- **shifts** - Individual shifts within schedules

Migrations are in `backend/cmd/migrate/migrations/` as sequentially numbered SQL files.

## API Documentation

Swagger docs are auto-generated and available at `/v1/swagger/` with basic auth when the backend is running. Credentials default to `admin:admin` (configurable via `AUTH_BASIC_USER` and `AUTH_BASIC_PASS`).

Regenerate docs after API changes: `make gen-docs` from `/backend`.

## Important Notes

- **Monorepo Structure:** Backend and frontend are separate subdirectories with their own dependencies
- **Redis is Optional:** Backend works without Redis; caching is a performance optimization
- **Air for Hot Reload:** Backend uses Air (`.air.toml`) for development. Pre-build command regenerates Swagger docs.
- **Transaction Helpers:** Use `withTx()` helper in `internal/store/storage.go:88-100` for multi-step database operations
- **Rate Limiting:** Configurable via `RATE_LIMITER_ENABLED` and `RATELIMITER_REQUESTS_COUNT` env vars
- **CORS:** Frontend URL must be configured in backend (`FRONTEND_URL` env var) for proper CORS handling
