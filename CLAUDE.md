# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RESA (Restaurant Employee Scheduling Application) is a full-stack web application for restaurant owners to manage employee shift scheduling. The backend is production-ready Go/PostgreSQL, while the frontend (Next.js/React) is under active development.

**Tech Stack:**

- **Backend:** Go 1.23.1, Chi router, PostgreSQL (raw SQL), Redis (optional caching), JWT auth, SendGrid emails
- **Frontend:** Next.js 15.5.5 (App Router), React 19, TypeScript, Tailwind CSS 4, ShadCN UI

## Development Commands

### Starting the Application

```bash
# Start all services (backend + frontend + Docker) with tmux
make dev

# Start without tmux (background processes with logs)
make dev-no-tmux

# Stop development servers (keeps Docker running)
make stop

# Tail application logs
make logs
```

The `make dev` command:

- Starts PostgreSQL and Redis via Docker Compose in `backend/` directory
- Runs backend with Air (hot reload) on `localhost:8080`
- Runs frontend with Turbopack on `localhost:3000`
- Uses tmux for easy window management (if available)

### Backend Commands

```bash
cd backend

# Development with hot reload (requires Air: go install github.com/air-verse/air@latest)
air

# Manual build
go build -o ./bin/main ./cmd/api

# Generate Swagger API documentation (regenerate after changing handlers)
make gen-docs

# Database migrations (requires golang-migrate)
make migrate-up         # Apply all pending migrations
make migrate-down       # Rollback last migration
make migrate-create <name>  # Create new migration files
```

**Note:** Migrations are in `backend/cmd/migrate/migrations/` as sequential `.up.sql` and `.down.sql` files.

### Frontend Commands

```bash
cd frontend

# Development server with Turbopack
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

## Architecture

### Backend Structure

```
backend/
├── cmd/
│   ├── api/              # HTTP layer - handlers, middleware, routing
│   │   ├── main.go       # Entry point, app initialization
│   │   ├── api.go        # Route definitions in mount() function
│   │   ├── {resource}.go # Handlers per resource (employees.go, roles.go, etc.)
│   │   └── middlewares.go # AuthTokenMiddleware, BasicAuthMiddleware, etc.
│   └── migrate/
│       └── migrations/   # SQL migrations (numbered sequentially)
├── internal/
│   ├── store/            # Data access layer (Repository Pattern)
│   │   ├── storage.go    # Interface definitions for all repositories
│   │   ├── {resource}.go # Repository implementations (employee.go, role.go, etc.)
│   │   └── cache/        # Redis caching implementations
│   ├── auth/             # JWT token generation/validation
│   ├── mailer/           # SendGrid email integration
│   ├── db/               # Database connection setup
│   ├── env/              # Environment variable utilities
│   └── ratelimiter/      # Rate limiting
└── docs/                 # Auto-generated Swagger docs (don't edit manually)
```

**Key Patterns:**

1. **Repository Pattern:** All database operations go through interfaces in `storage.go`. No direct DB access from handlers.

2. **Clean Architecture:**

   - Handlers parse requests and handle HTTP concerns
   - Store methods handle database queries
   - Clear separation between layers

3. **No ORM:** Raw SQL with parameterized queries (`$1, $2, $3` placeholders)

4. **Context Timeouts:** All DB queries use `QueryTimeoutDuration` (5 seconds)

5. **Optional Caching:** Redis can be enabled/disabled via `REDIS_ENABLED` env var without breaking functionality

6. **Authorization Pattern:**
   - All restaurant-scoped endpoints verify ownership
   - Return `404` (not `401`) to non-owners to prevent information disclosure
   - Use `checkRestaurantOwnership()` middleware wrapper

### Frontend Structure

```
frontend/
├── app/
│   ├── (resa)/          # Protected routes - route group requiring auth
│   │   ├── layout.tsx   # Auth boundary with sidebar layout
│   │   └── dashboard/
│   ├── login/
│   ├── signup/
│   └── confirm/         # Magic link email confirmation
├── components/
│   ├── ui/              # ShadCN UI primitives (shadcn-ui.com)
│   ├── marketing/
│   └── resa/            # App-specific components
│       ├── sidebar-left/    # Navigation sidebar
│       ├── sidebar-right/   # Context panels (employee/role details)
│       └── sidebar-core/    # Shared sidebar primitives
├── lib/
│   ├── auth.tsx         # Auth context, token management, fetchWithAuth()
│   ├── api.ts           # API client utilities
│   ├── restaurant-context.tsx  # Current restaurant state management
│   └── utils.ts         # General utilities
└── hooks/               # Custom React hooks
```

**Key Patterns:**

1. **Route Groups:** `(resa)` is a Next.js route group - groups routes without affecting URL structure

2. **Authentication:**

   - JWT tokens stored in localStorage
   - `AuthProvider` context wraps the app
   - `useAuth()` hook provides login/logout/user state
   - `fetchWithAuth()` handles automatic token refresh on 401

3. **Protected Routes:**

   - `app/(resa)/layout.tsx` checks auth and redirects to `/login` if needed
   - All pages under `(resa)/` are automatically protected

4. **Restaurant Context:**

   - `RestaurantProvider` manages currently selected restaurant
   - Wraps protected routes in `(resa)/layout.tsx`

5. **API Integration:**
   - Base URL from `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:8080/v1`)
   - Use `fetchWithAuth()` from `lib/auth.tsx` for authenticated requests

## Database

**Connection:** PostgreSQL via Docker Compose (`backend/docker-compose.yml`)

**Schema:** Migrations in `backend/cmd/migrate/migrations/`

**Core Entities:**

- `users` - Application users (owners and employees)
- `restaurants` - Restaurant locations owned by users
- `employees` - Employee records per restaurant
- `roles` - Job positions (many-to-many with employees via `employee_roles`)
- `shift_templates` - Recurring shift patterns
- `schedules` - Weekly schedule containers
- `scheduled_shifts` - Individual shifts within schedules

**Migration Pattern:**

- Sequential numbered files: `000001_name.up.sql` and `000001_name.down.sql`
- Always write both up and down migrations
- Use `make migrate-create <name>` to generate new migration pair

## Authentication Flow

RESA uses **passwordless authentication** (magic links):

1. User signs up with email
2. Backend sends magic link via SendGrid
3. User clicks link → account activated
4. JWT token issued (24h expiry)
5. Token stored in localStorage
6. Auto-refresh at 80% of token lifetime

**For Development:**

- Backend: JWT secret in `AUTH_TOKEN_SECRET` env var
- Frontend: Tokens managed by `lib/auth.tsx`
- API requires `Authorization: Bearer <token>` header for protected routes

## API Documentation

Swagger UI available at `http://localhost:8080/v1/swagger/` (basic auth: `admin:admin`)

**Regenerating Docs:**

```bash
cd backend
make gen-docs
```

**Swagger Comment Pattern:**

```go
// HandlerName godoc
//
//  @Summary      Brief description
//  @Description  Detailed description
//  @Tags         resource-name
//  @Accept       json
//  @Produce      json
//  @Param        restaurantID  path  int  true  "Restaurant ID"
//  @Success      200  {object}  ResponseType
//  @Failure      400  {object}  error
//  @Security     ApiKeyAuth
//  @Router       /restaurants/{restaurantID}/resource [get]
func (app *application) handlerName(w http.ResponseWriter, r *http.Request) {
    // Implementation
}
```

## Backend Development Guidelines

### Adding New Endpoints

See detailed templates in `context/backend/base-endpoint-spec-template.md`

**Quick Pattern:**

1. **Define interface** in `internal/store/storage.go`:

```go
type Storage struct {
    Resources interface {
        GetByID(context.Context, int64) (*Resource, error)
        // ...
    }
}
```

2. **Implement repository** in `internal/store/resource.go`:

```go
func (s *ResourceStore) GetByID(ctx context.Context, id int64) (*Resource, error) {
    ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
    defer cancel()

    query := `SELECT id, field FROM table WHERE id = $1`
    // ... parameterized query
}
```

3. **Create handler** in `cmd/api/resources.go`:

```go
func (app *application) getResourceHandler(w http.ResponseWriter, r *http.Request) {
    // 1. Parse URL params
    // 2. Get user from context
    // 3. Verify restaurant ownership → return 404 if not owner
    // 4. Call store method
    // 5. Return JSON response
}
```

4. **Register route** in `cmd/api/api.go`:

```go
r.Route("/restaurants/{restaurantID}", func(r chi.Router) {
    r.Use(app.AuthTokenMiddleware)
    r.Get("/resources/{id}", app.getResourceHandler)
})
```

5. **Add Swagger comments** and run `make gen-docs`

### Security Requirements

- **Always** use parameterized queries (`$1, $2`) - never string concatenation
- **Always** verify restaurant ownership before operations
- **Always** return `404` (not `401`) to non-owners to prevent info disclosure
- **Always** validate input with struct tags: `validate:"required,email,max=255"`
- **Always** use context timeouts for DB operations
- Use `app.checkRestaurantOwnership()` middleware for owner-only routes

### Error Handling

```go
// 400 - Invalid input
app.badRequestResponse(w, r, err)

// 401 - Not authenticated
app.unauthorizedErrorResponse(w, r, err)

// 404 - Resource not found OR unauthorized (for ownership checks)
app.notFoundResponse(w, r, err)

// 500 - Server error
app.internalServerError(w, r, err)
```

**Pattern for ownership verification:**

```go
restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
if err != nil {
    switch {
    case errors.Is(err, store.ErrNotFound):
        app.notFoundResponse(w, r, err)
    default:
        app.internalServerError(w, r, err)
    }
    return
}

// Return 404 (not 401) to prevent information disclosure
if restaurant.UserID != user.ID {
    app.notFoundResponse(w, r, errors.New("restaurant not found"))
    return
}
```

## Frontend Development Guidelines

### Route Structure

- **Public routes:** `app/login`, `app/signup`, `app/confirm`
- **Protected routes:** Everything under `app/(resa)/`
- **Layout boundary:** `app/(resa)/layout.tsx` enforces auth check

### State Management

**Authentication:**

```tsx
import { useAuth } from "@/lib/auth";

const { user, isAuthenticated, login, logout } = useAuth();
```

**Restaurant Context:**

```tsx
import { useRestaurant } from "@/lib/restaurant-context";

const { selectedRestaurant, setSelectedRestaurant } = useRestaurant();
```

### API Calls

**Pattern:**

```tsx
import { fetchWithAuth } from "@/lib/auth";
import { getApiBase } from "@/lib/api";

const response = await fetchWithAuth(`${getApiBase()}/restaurants/${id}`, {
  method: "GET",
  headers: { "Content-Type": "application/json" },
});

const data = await response.json();
```

`fetchWithAuth()` automatically:

- Adds Authorization header
- Refreshes token on 401
- Throws on auth failure

### Component Patterns

- Use ShadCN components from `components/ui/`
- App-specific components in `components/resa/`
- Follow existing patterns in sidebar components for sheets, dialogs, forms
- Use React Hook Form + Zod for form validation

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
ADDR=:8080
EXTERNAL_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGIN=http://localhost:3000

# Database
DB_ADDR=postgres://admin:adminpassword@localhost:5432/resa?sslmode=disable
DB_MAX_OPEN_CONNS=30
DB_MAX_IDLE_CONNS=30
DB_MAX_IDLE_TIME=15m

# Redis (optional)
REDIS_ENABLED=true
REDIS_ADDR=localhost:6379
REDIS_PW=
REDIS_DB=0

# Authentication
AUTH_TOKEN_SECRET=your-secret-key
AUTH_BASIC_USER=admin
AUTH_BASIC_PASS=admin

# Email
SENDGRID_API_KEY=your-api-key
FROM_EMAIL=noreply@example.com

# Rate Limiting
RATE_LIMITER_ENABLED=true
RATELIMITER_REQUESTS_COUNT=20
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/v1
```

## Docker Services

**Start services:**

```bash
cd backend
docker compose up -d
```

**Services:**

- PostgreSQL: `localhost:5432` (user: `admin`, pass: `adminpassword`, db: `resa`)
- Redis: `localhost:6379`
- Redis Commander UI: `localhost:8081`

**Stop services:**

```bash
cd backend
docker compose down
```

## Common Workflows

### Adding a New Feature Endpoint

1. Read `context/backend/base-endpoint-spec-template.md` for detailed pattern
2. Add method to interface in `storage.go`
3. Implement in appropriate `internal/store/{resource}.go`
4. Create handler in `cmd/api/{resource}.go` with Swagger comments
5. Register route in `cmd/api/api.go`
6. Run `make gen-docs` to update Swagger
7. Test with cURL or Swagger UI

### Frontend: Adding a New Protected Page

1. Create page in `app/(resa)/your-page/page.tsx`
2. Automatically protected by `(resa)/layout.tsx`
3. Use `useAuth()` for user data, `fetchWithAuth()` for API calls
4. Add navigation link in `components/resa/sidebar-left/`

### Debugging

**Backend:**

- Logs via zap (structured logging)
- Health check: `http://localhost:8080/v1/health` (requires basic auth)
- Metrics: `http://localhost:8080/v1/debug/vars` (requires basic auth)

**Frontend:**

- Check browser console for auth issues
- Verify token in localStorage (`auth_token` key)
- Check Network tab for API request/response

## Important Notes

- Backend uses **raw SQL** with parameterized queries - no ORM
- All restaurant operations require ownership verification
- Return `404` for unauthorized access to prevent info leakage
- Redis is optional - app works without it
- Frontend uses Next.js App Router (not Pages Router)
- Route groups like `(resa)` don't affect URLs - only for organization
- JWT tokens auto-refresh at 80% of lifetime
- Magic link authentication - no passwords stored
- Swagger UI requires basic auth (default: admin/admin)
