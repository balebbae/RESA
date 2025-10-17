# Authentication & Session Management

## Overview
RESA uses **passwordless authentication** via magic links + JWT tokens for session management. The backend implements a multi-step user registration saga with email verification.

---

## Authentication Methods

### 1. Magic Link Registration (Passwordless - Primary)
**Flow**: User Registration → Email Verification → Account Activation

#### Step 1: User Registration
**Endpoint**: `POST /v1/authentication/user`

**Request**:
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword"
}
```

**Backend Process**:
1. Validates payload (email format, password min 3 chars)
2. Hashes password with bcrypt
3. Generates UUID invitation token (plain)
4. Hashes token with SHA256 for database storage
5. Stores user + hashed token in `user_invitations` table
6. Sends magic link email via SendGrid: `{FRONTEND_URL}/confirm/{plainToken}`
7. **Saga Pattern**: Rolls back user creation if email fails

**Response** (201):
```json
{
  "id": 123,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "is_active": false,
  "token": "plain-uuid-token-here"
}
```

#### Step 2: Account Activation
**Endpoint**: `PUT /v1/users/activate/{token}`

**Backend Process**:
1. Hashes provided token with SHA256
2. Queries `user_invitations` table for matching hash
3. Validates token not expired
4. Sets `users.is_active = true`
5. Deletes invitation token from database

**Response**: 204 No Content

**Frontend Action**: Redirect to login or auto-create token

---

### 2. Password-Based Login
**Endpoint**: `POST /v1/authentication/token`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Backend Process**:
1. Fetches user by email (only `is_active = true` users)
2. Compares password with bcrypt hash
3. Generates JWT token with claims

**Response** (201):
```json
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## JWT Token Structure

### Claims
```json
{
  "sub": 123,                    // User ID
  "exp": 1736956800,             // Expiration timestamp
  "iat": 1736870400,             // Issued at timestamp
  "nbf": 1736870400,             // Not before timestamp
  "iss": "resa-api",             // Issuer (from AUTH_TOKEN_ISS env var)
  "aud": "resa-api"              // Audience (same as issuer)
}
```

### Token Validation Rules
- **Algorithm**: HS256 (HMAC-SHA256)
- **Secret**: From `AUTH_TOKEN_SECRET` env variable
- **Expiration**: Configurable via `AUTH_TOKEN_EXP` (default: 24 hours)
- **Validation**: Requires `exp`, `aud`, `iss` claims

---

## Token Refresh
**Endpoint**: `POST /v1/authentication/refresh`

**Request Headers**:
```
Authorization: Bearer <current-valid-token>
```

**Backend Process**:
1. Validates existing token (must be valid but may be near expiry)
2. Extracts `sub` (user ID) from claims
3. Generates new token with fresh expiry time
4. Returns new token with same user ID

**Response** (200):
```json
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // New token
```

**Frontend Strategy**:
- Refresh token proactively before expiration
- Implement refresh on 401 responses
- Store expiry time and trigger refresh at 80% lifetime

---

## Session Management

### Authentication Middleware (`AuthTokenMiddleware`)
**Applied to**: All `/v1/restaurants/*` routes

**Process**:
1. Extracts `Authorization: Bearer <token>` header
2. Validates token signature and claims
3. Extracts user ID from `sub` claim
4. Fetches user from database (verifies still active)
5. Injects user into request context

**Context Key**: `"user"`

**Usage in Handlers**:
```go
user := getUserFromContext(r)  // Returns *store.User
```

---

## Frontend Implementation Guide

### 1. Storage
**Store in Memory/State** (NOT localStorage for security):
- JWT token string
- Token expiry timestamp
- User object (from login response)

### 2. HTTP Client Setup
**Axios/Fetch Interceptor**:
```typescript
// Request interceptor
axios.interceptors.request.use(config => {
  const token = getToken(); // From your state management
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 3. Protected Routes
**Next.js Middleware** (`middleware.ts`):
```typescript
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token && request.nextUrl.pathname.startsWith('/home')) {
    return NextRedirect('/login');
  }
}
```

### 4. Magic Link Flow
**Signup Page** → **Confirmation Page** → **Home**

**`/signup` Page**:
1. POST `/v1/authentication/user`
2. Show "Check your email" message
3. Store token from response (optional, for testing)

**`/confirm/[token]` Page**:
1. Extract token from URL params
2. PUT `/v1/users/activate/{token}`
3. On success: POST `/v1/authentication/token` with credentials
4. Store JWT token
5. Redirect to `/home`

### 5. Login Page
**`/login` Page**:
1. POST `/v1/authentication/token` with email/password
2. Store JWT token and expiry
3. Redirect to `/home`

---

## Error Handling

### Common Errors
| Status | Error | Meaning |
|--------|-------|---------|
| 400 | Bad Request | Invalid payload format/validation failed |
| 401 | Unauthorized | Invalid credentials, token expired, or missing auth header |
| 404 | Not Found | User not found or activation token invalid/expired |
| 500 | Internal Server Error | Database/server errors |

### Duplicate Email
**Response** (400):
```json
{
  "error": "a user with that email already exists"
}
```

### Invalid/Expired Activation Token
**Response** (404):
```json
{
  "error": "not found"
}
```

---

## Security Features

### Password Storage
- **Hashing**: bcrypt with default cost (10)
- **Validation**: Min 3 chars, max 72 chars (bcrypt limit)

### Token Security
- Invitation tokens: SHA256 hashed in database
- JWT secret: Environment variable (`AUTH_TOKEN_SECRET`)
- CORS: Configured for frontend URL only (`CORS_ALLOWED_ORIGIN`)

### Rate Limiting
**Optional** (via `RATE_LIMITER_ENABLED` env var):
- Applied globally to all routes
- Tracks by IP address (`r.RemoteAddr`)

### User Enumeration Protection
- Login returns generic 401 for both "user not found" and "wrong password"
- No specific error messages revealing user existence

---

## Environment Variables

### Backend Configuration
```bash
# JWT Authentication
AUTH_TOKEN_SECRET=your-secret-key-here
AUTH_TOKEN_EXP=24h
AUTH_TOKEN_ISS=resa-api

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
MAIL_FROM_EMAIL=noreply@yourdomain.com
MAIL_INVITATION_EXP=72h  # Magic link expiry

# Frontend
FRONTEND_URL=http://localhost:3000

# CORS
CORS_ALLOWED_ORIGIN=http://localhost:3000
```

### Frontend Configuration
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## API Endpoints Summary

### Public (No Auth Required)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/v1/authentication/user` | Register new user |
| POST | `/v1/authentication/token` | Login (get JWT) |
| POST | `/v1/authentication/refresh` | Refresh JWT token |
| PUT | `/v1/users/activate/{token}` | Activate account via magic link |

### Protected (Requires JWT)
- All `/v1/restaurants/*` routes
- User context available via middleware

---

## Database Schema

### `users` Table
- `id` (bigint, PK)
- `email` (varchar, unique)
- `password` (bytea, bcrypt hash)
- `first_name` (varchar)
- `last_name` (varchar)
- `is_active` (boolean, default: false)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `user_invitations` Table
- `token` (varchar, SHA256 hash of UUID)
- `user_id` (bigint, FK → users.id)
- `expiry` (timestamp)

---

## Implementation Checklist

- [ ] Create auth context/store for token management
- [ ] Implement HTTP interceptors for Authorization header
- [ ] Build signup form with email validation
- [ ] Create `/confirm/[token]` activation page
- [ ] Build login form
- [ ] Implement token refresh logic
- [ ] Add protected route middleware
- [ ] Handle 401 errors globally (logout/redirect)
- [ ] Store user state after successful auth
- [ ] Implement logout (clear token/state)
- [ ] Add loading states during auth operations
- [ ] Display backend validation errors in forms
