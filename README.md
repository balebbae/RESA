# RESA - Restaurant Employee Scheduling Application

A modern, full-stack web application for restaurant owners to streamline employee shift management. Built with Go, Next.js, and PostgreSQL, RESA supports both manual schedule creation and AI-powered generation for optimal staffing.

> **Note:** Backend is complete and production-ready. Frontend is currently under active development.

## Features

- **Employer & Employee Roles** - Separate interfaces for managers and staff
- **Restaurant Management** - Create and manage multiple restaurant locations
- **Employee Scheduling** - Intuitive drag-and-drop or AI-assisted scheduling
- **Invitations & Join Codes** - Easy employee onboarding via invite links or restaurant codes
- **Automated Notifications** - SMS and Email alerts for weekly schedules
- **Magic Link Authentication** - Secure, passwordless authentication via email
- **High Performance** - Redis caching for optimized data retrieval

## Tech Stack

### Backend
- **Language:** Go 1.23.1
- **Framework:** Chi (lightweight, idiomatic HTTP router)
- **Database:** PostgreSQL (raw SQL, no ORM)
- **Cache:** Redis (optional)
- **Authentication:** JWT tokens + Magic Links
- **Email:** SendGrid
- **Architecture:** Clean Architecture with Repository Pattern

### Frontend
- **Framework:** Next.js 15.5.5 with App Router
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **Components:** ShadCN UI + Radix UI primitives
- **Animations:** Motion + tw-animate-css

## Getting Started

### Prerequisites

- Go 1.23.1 or higher
- Node.js 20+ and npm
- PostgreSQL 14+
- Redis (optional, for caching)
- SendGrid API key (for email notifications)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create `.env` file with required variables:**
   ```env
   # Server
   ADDR=:8080
   EXTERNAL_URL=http://localhost:8080
   FRONTEND_URL=http://localhost:3000

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
   AUTH_TOKEN_SECRET=your-secret-key-here
   AUTH_BASIC_USER=admin
   AUTH_BASIC_PASS=admin

   # Email
   SENDGRID_API_KEY=your-sendgrid-api-key
   FROM_EMAIL=noreply@yourdomain.com

   # Rate Limiting
   RATE_LIMITER_ENABLED=true
   RATELIMITER_REQUESTS_COUNT=20
   ```

3. **Start PostgreSQL and Redis (using Docker Compose):**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations:**
   ```bash
   make migrate-up
   ```

5. **Seed the database (optional):**
   ```bash
   make seed
   ```

6. **Start the development server:**
   ```bash
   air
   ```

   The API will be available at `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env.local` file:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/v1
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Development

### Backend Commands

```bash
# Hot reload development (recommended)
air

# Build manually
go build -o ./bin/main ./cmd/api

# Run tests
make test

# Database migrations
make migrate-up         # Apply all pending migrations
make migrate-down       # Rollback last migration
make migrate-create <name>  # Create new migration

# Generate API documentation
make gen-docs
```

### Frontend Commands

```bash
# Development with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## API Documentation

Swagger documentation is available at `http://localhost:8080/v1/swagger/` when the backend is running.

**Default credentials:** `admin:admin` (configurable via `AUTH_BASIC_USER` and `AUTH_BASIC_PASS`)

To regenerate documentation after making API changes:
```bash
cd backend
make gen-docs
```

## Architecture Overview

### Backend Structure

```
backend/
├── cmd/
│   ├── api/           # HTTP handlers, middleware, routing
│   └── migrate/       # Database migrations
├── internal/
│   ├── store/         # Repository pattern data access layer
│   │   └── cache/     # Redis caching implementations
│   ├── auth/          # JWT authentication
│   ├── mailer/        # Email service integration
│   ├── db/            # Database connection
│   └── ratelimiter/   # Rate limiting
└── docs/              # Swagger documentation (auto-generated)
```

**Key Design Patterns:**
- **Repository Pattern:** All data access goes through interface-based stores
- **Clean Architecture:** Clear separation between HTTP, business logic, and data layers
- **Saga Pattern:** User creation follows a multi-step saga with compensation logic
- **Optional Caching:** Redis integration for performance without hard dependency

### Frontend Structure

```
frontend/
├── app/
│   ├── (resa)/        # Authenticated routes (route group)
│   ├── login/         # Authentication pages
│   ├── signup/
│   └── confirm/       # Magic link confirmation
├── components/
│   ├── ui/            # ShadCN UI components
│   ├── marketing/     # Marketing page components
│   └── resa/          # App-specific components
└── lib/               # Utilities and API configuration
```

## Database Schema

Core entities:
- **users** - Application users (restaurant owners and employees)
- **restaurants** - Restaurant information and ownership
- **roles** - Employee positions/roles within restaurants
- **employees** - Employee records linked to restaurants
- **schedules** - Weekly work schedules
- **shifts** - Individual shift assignments within schedules

## Authentication Flow

RESA uses a passwordless authentication system:

1. User signs up with email
2. Magic link sent via SendGrid
3. User clicks link to verify email and activate account
4. JWT token issued for subsequent requests
5. Token stored client-side for authenticated API calls

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests: `make test` (backend) and `npm run lint` (frontend)
4. Submit a pull request

## Support

For issues or questions, please contact the development me.
