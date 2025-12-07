# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RESA (Restaurant Employee Scheduling Application) is a full-stack scheduling system with a Go backend API and Next.js 15 React frontend. It enables restaurant managers to create schedules, manage employees and roles, and assign shifts.

## Development Commands

### Backend (Go)
```bash
# Run with hot reload (requires Air installed)
air

# Or manual run
go run cmd/api/main.go

# Generate Swagger docs (run before commits if API changed)
make gen-docs

# Run tests
make test

# Database migrations
make migrate-up              # Apply pending migrations
make migrate-down            # Rollback last migration
make migrate-create [name]   # Create new migration files
make seed                    # Seed database with test data
```

### Frontend (Next.js)
```bash
cd client/web
npm run dev          # Development server with Turbopack (port 3000)
npm run build        # Production build
npm run lint         # ESLint
```

### Infrastructure
```bash
docker-compose up -d    # Start PostgreSQL + Redis containers
# PostgreSQL: localhost:5432, Redis: localhost:6379
```

## Architecture

### Backend Structure
- `cmd/api/` - HTTP handlers, routes, middleware. Each resource has its own handler file (employees.go, roles.go, schedules.go, etc.)
- `cmd/migrate/migrations/` - SQL migration files (numbered sequentially)
- `internal/store/` - Database layer with repository pattern. `storage.go` defines interfaces, other files implement them
- `internal/auth/` - JWT authentication and Google OAuth
- `internal/store/cache/` - Redis caching layer (optional, controlled by REDIS_ENABLED)

### Frontend Structure
- `client/web/app/` - Next.js App Router with route groups: `(auth)` for login/signup, `(marketing)` for landing page, `(resa)` for protected app
- `client/web/components/` - Feature-organized components (calendar/, employees/, roles/, schedules/)
- `client/web/components/ui/` - shadcn/ui component library
- `client/web/hooks/` - Custom React hooks for data fetching and state
- `client/web/lib/auth.tsx` - Auth context and token management
- `client/web/types/` - TypeScript type definitions

### API Pattern
Routes defined in `cmd/api/api.go`. Protected routes nest under `/v1/restaurants/{restaurantID}/`:
- `/roles`, `/employees`, `/shift-templates`, `/schedules`
- Each schedule has `/shifts` for individual shift management

Handlers follow pattern: read request → validate → call store → return JSON response.

### Database Models
Core entities: users, restaurants, employees, roles (with colors), shift_templates (recurring), schedules (weekly), scheduled_shifts (individual assignments).

Custom Go types in `internal/store/types.go`: `TimeOfDay` for PostgreSQL TIME, `DateOnly` for DATE columns.

### Frontend Data Flow
React Context for global state (`AuthProvider`, `RestaurantContext`). Custom hooks (`useEmployees`, `useRoles`, `useSchedules`) handle API calls. Forms use react-hook-form with Zod validation.

## Key Conventions

- API endpoints use kebab-case: `/shift-templates`, `/scheduled-shifts`
- Go handlers named `{action}{Resource}Handler` (e.g., `createEmployeeHandler`)
- Frontend hooks prefixed with `use` (e.g., `useEmployeeForm`)
- Swagger decorators required on all API handlers for doc generation
- Restaurant context middleware loads restaurant for all nested routes automatically

## Environment Files

Backend: `.env` (DB_ADDR, AUTH_TOKEN_SECRET, GOOGLE_CLIENT_ID/SECRET, SENDGRID_API_KEY, CORS_ALLOWED_ORIGIN)

Frontend: `client/web/.env.local` (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
