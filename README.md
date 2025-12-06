# RESA

**Restaurant Employee Scheduling Application**

A full-stack web application for restaurant managers to create schedules, manage employees and roles, and assign shifts with an intuitive calendar interface.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Go](https://img.shields.io/badge/Go-1.24-00ADD8?logo=go)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-6.2-DC382D?logo=redis)

## Features

- **Multi-Restaurant Support** - Manage multiple restaurant locations from a single account
- **Employee Management** - Add, edit, and organize staff with role assignments
- **Role-Based Organization** - Create custom roles with color coding for visual distinction
- **Shift Templates** - Define recurring shift patterns for quick schedule population
- **Weekly Schedule View** - Interactive calendar with drag-and-drop shift management
- **Auto-Populate Schedules** - Generate schedules from shift templates automatically
- **Schedule Publishing** - Email schedules directly to employees
- **Google OAuth** - Sign in with Google for seamless authentication
- **Real-time Updates** - Redis caching for responsive performance

## Tech Stack

### Backend
- **Go** with Chi router
- **PostgreSQL** for data persistence
- **Redis** for caching (optional)
- **JWT** authentication with Google OAuth support
- **SendGrid** for transactional emails
- **Swagger/OpenAPI** documentation

### Frontend
- **Next.js 15** with App Router and Turbopack
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **shadcn/ui** component library
- **react-hook-form** with Zod validation
- **Google Maps API** for address autocomplete

## Prerequisites

- Go 1.24+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 6.2 (optional, or use Docker)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/balebbae/RESA.git
cd RESA
```

### 2. Start the database

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

### 3. Configure environment

Create a `.env` file in the root directory:

```env
# Server
ADDR=":8080"
EXTERNAL_URL="localhost:8080"
FRONTEND_URL="http://localhost:3000"
ENV="development"

# Database
DB_ADDR="postgres://admin:adminpassword@localhost:5432/resa?sslmode=disable"
DB_MAX_OPEN_CONNS=30
DB_MAX_IDLE_CONNS=30
DB_MAX_IDLE_TIME="15m"

# Redis (optional)
REDIS_ADDR="localhost:6379"
REDIS_ENABLED=false
REDIS_DB=0

# Authentication
AUTH_TOKEN_SECRET="your-secret-key-here"
AUTH_BASIC_USER="admin"
AUTH_BASIC_PASS="admin"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URL="http://localhost:3000/auth/google/callback"

# Email (optional)
FROM_EMAIL=""
SENDGRID_API_KEY=""

# CORS
CORS_ALLOWED_ORIGIN="http://localhost:3000"

# Rate Limiter
RATE_LIMITER_ENABLED=true
RATELIMITER_REQUESTS_COUNT=20
```

Create `client/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/v1
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### 4. Run database migrations

```bash
make migrate-up
```

### 5. Start the backend

```bash
# With hot reload (requires Air: go install github.com/air-verse/air@latest)
air

# Or without hot reload
go run cmd/api/main.go
```

The API will be available at `http://localhost:8080`.

### 6. Start the frontend

```bash
cd client/web
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
RESA/
├── cmd/
│   ├── api/                 # HTTP handlers and routes
│   └── migrate/
│       ├── migrations/      # SQL migration files
│       └── seed/            # Database seeding
├── internal/
│   ├── auth/                # JWT and OAuth authentication
│   ├── db/                  # Database connection
│   ├── mailer/              # Email service (SendGrid)
│   ├── ratelimiter/         # Rate limiting
│   └── store/               # Data access layer
│       └── cache/           # Redis caching
├── client/web/              # Next.js frontend
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and API client
│   └── types/               # TypeScript definitions
├── docs/                    # Generated Swagger docs
├── docker-compose.yml       # Local development containers
└── Makefile                 # Build and migration commands
```

## Available Commands

### Backend

| Command | Description |
|---------|-------------|
| `make migrate-up` | Apply pending migrations |
| `make migrate-down` | Rollback last migration |
| `make migrate-create name` | Create new migration files |
| `make seed` | Seed database with test data |
| `make gen-docs` | Generate Swagger documentation |
| `make test` | Run tests |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |

## API Documentation

Swagger documentation is available at `http://localhost:8080/v1/swagger/index.html` (requires basic auth).

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/authentication/user` | Register new user |
| POST | `/v1/authentication/token` | Login |
| GET | `/v1/restaurants` | List user's restaurants |
| POST | `/v1/restaurants` | Create restaurant |
| GET | `/v1/restaurants/:id/employees` | List employees |
| GET | `/v1/restaurants/:id/roles` | List roles |
| GET | `/v1/restaurants/:id/schedules` | List schedules |
| POST | `/v1/restaurants/:id/schedules/:sid/auto-populate` | Auto-fill schedule |

## License

MIT
