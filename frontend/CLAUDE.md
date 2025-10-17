# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RESA Frontend is a Next.js 15 application built with React 19 and TypeScript, serving as the user interface for the Restaurant Employee Scheduling Application. The backend (Go-based) is complete; this frontend is under active development.

**Tech Stack:**
- Next.js 15.5.5 with App Router and Turbopack
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- ShadCN UI (New York style) + Radix UI primitives
- React Hook Form + Zod for form validation
- Motion for animations
- Date-fns for date handling

## Development Commands

```bash
# Start development server with Turbopack (hot reload enabled)
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

**Environment Setup:** Requires `.env.local` with `NEXT_PUBLIC_API_URL` pointing to the backend API (e.g., `http://localhost:8080/v1`). See `lib/api.ts:1-5` for API base URL configuration.

## Architecture

### Directory Structure

```
frontend/
├── app/
│   ├── (resa)/        # Authenticated routes (route group)
│   │   ├── home/      # Main authenticated home page
│   │   └── settings/  # User/restaurant settings
│   ├── login/         # Login page
│   ├── signup/        # Sign up page
│   ├── confirm/       # Magic link confirmation
│   ├── dashboard/     # Dashboard (legacy/migration?)
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Landing page
│   └── globals.css    # Global styles + Tailwind imports
├── components/
│   ├── ui/            # ShadCN UI components (56+ components)
│   ├── marketing/     # Marketing/landing page components
│   └── resa/          # App-specific components
│       ├── app-sidebar.tsx
│       ├── date-picker.tsx
│       ├── employees.tsx
│       └── nav-user.tsx
├── lib/
│   ├── api.ts         # API base URL configuration
│   └── utils.ts       # Utility functions (cn, etc.)
└── hooks/
    └── use-mobile.ts  # Mobile detection hook
```

### Key Patterns

1. **Route Groups:** The `(resa)` directory is a Next.js route group for authenticated pages. This allows grouping routes without affecting URL structure.

2. **ShadCN UI Configuration:** Configured in `components.json` with:
   - Style: "new-york"
   - Base color: "slate"
   - CSS variables enabled
   - Icon library: Lucide React
   - Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/ui`

3. **Import Aliases:** TypeScript paths configured in `tsconfig.json:21-23`:
   - `@/*` maps to root directory
   - Use `@/components/ui/button` instead of relative paths

4. **Component Library:** UI components are from ShadCN (Radix UI-based). Import from `@/components/ui/*`. Do not modify these directly; extend them in `components/resa/` for app-specific needs.

5. **Forms:** Use React Hook Form with Zod validation. Date handling uses date-fns.

6. **Styling:** Tailwind CSS 4 with custom animations via `tw-animate-css`. Global styles in `app/globals.css`.

## Backend Integration

The frontend connects to a Go-based REST API. Key integration points:

- **API Base URL:** Configured via `NEXT_PUBLIC_API_URL` env var (see `lib/api.ts`)
- **Authentication:** JWT tokens via magic link flow
  1. User signs up → email sent
  2. Click magic link → lands on `/confirm` route
  3. JWT issued → stored for authenticated requests
- **API Structure:** All backend endpoints are under `/v1` path

## Important Notes

- **Turbopack:** Dev and build commands use `--turbopack` flag for faster builds
- **React 19:** This project uses React 19 (latest). Be aware of any API changes from React 18
- **Monorepo Context:** Frontend lives in `/frontend` subdirectory. Backend is separate in `/backend`
- **Work in Progress:** Frontend is under active development. Backend API is stable and complete
- **No Custom Hooks Yet:** Only one custom hook (`use-mobile.ts`) currently exists
- **Marketing Components:** Separate from app components in `components/marketing/`
