# Google OAuth Frontend Implementation Specification

**Project:** RESA (Restaurant Employee Scheduling Application)
**Target:** Frontend Team
**Date:** 2025-10-16
**Backend Status:** ✅ Complete and ready for integration

---

## Overview

This specification describes how to implement Google OAuth authentication in the RESA frontend (Next.js 15 + React 19 + TypeScript). The backend OAuth implementation is complete and provides two REST endpoints for the OAuth flow.

**What changes:**
- Add Google OAuth button functionality to Login and Signup pages
- Add OAuth callback handling route
- Extend existing auth system to support OAuth tokens
- No changes needed to existing email/password authentication

---

## Backend API Endpoints (Already Implemented)

### 1. **Initiate OAuth Flow**
```
POST /v1/authentication/google
```

**Request:** Empty body (or can be empty JSON `{}`)

**Response (200 OK):**
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "uuid-v4-string-for-csrf-protection"
}
```

**Purpose:** Returns the Google OAuth authorization URL that the user should be redirected to.

---

### 2. **Complete OAuth Flow (Callback)**
```
POST /v1/authentication/google/callback
```

**Request Body:**
```json
{
  "code": "4/0AbC-dEfG...",  // Authorization code from Google
  "state": "uuid-from-step-1"  // State token from initiate endpoint
}
```

**Response (200 OK - Existing User):**
```json
{
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // JWT token
}
```

**Response (201 Created - New User):**
```json
{
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // JWT token
}
```

**Error Responses:**
- `400 Bad Request` - Invalid code or state
- `401 Unauthorized` - Failed to authenticate with Google
- `500 Internal Server Error` - Server error

**Backend Behavior:**
1. Exchanges code with Google for user info
2. Checks if user exists by Google ID → logs them in
3. Checks if user exists by email → auto-links Google account and logs them in
4. Creates new user if neither exists → logs them in
5. Returns standard JWT token (same format as email/password login)

---

## Implementation Tasks

### Task 1: Add OAuth State Management

**File to create:** `frontend/lib/oauth.ts`

```typescript
"use client"

/**
 * OAuth flow state management
 * Handles CSRF protection via state parameter
 */

const OAUTH_STATE_KEY = "oauth_state"
const OAUTH_STATE_EXPIRY = 10 * 60 * 1000 // 10 minutes

interface OAuthState {
  state: string
  timestamp: number
  redirectTo?: string  // Optional: where to redirect after OAuth completes
}

/**
 * Generate and store OAuth state for CSRF protection
 */
export function setOAuthState(redirectTo?: string): string {
  if (typeof window === "undefined") return ""

  const state = crypto.randomUUID()
  const stateData: OAuthState = {
    state,
    timestamp: Date.now(),
    redirectTo,
  }

  sessionStorage.setItem(OAUTH_STATE_KEY, JSON.stringify(stateData))
  return state
}

/**
 * Validate and retrieve OAuth state
 * Returns null if state is invalid or expired
 */
export function validateOAuthState(state: string): OAuthState | null {
  if (typeof window === "undefined") return null

  const storedData = sessionStorage.getItem(OAUTH_STATE_KEY)
  if (!storedData) {
    console.error("No OAuth state found in storage")
    return null
  }

  try {
    const parsed: OAuthState = JSON.parse(storedData)

    // Check if expired (10 minutes)
    if (Date.now() - parsed.timestamp > OAUTH_STATE_EXPIRY) {
      console.error("OAuth state expired")
      clearOAuthState()
      return null
    }

    // Validate state matches
    if (parsed.state !== state) {
      console.error("OAuth state mismatch")
      clearOAuthState()
      return null
    }

    return parsed
  } catch (error) {
    console.error("Failed to parse OAuth state:", error)
    clearOAuthState()
    return null
  }
}

/**
 * Clear OAuth state from storage
 */
export function clearOAuthState(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(OAUTH_STATE_KEY)
}

/**
 * Initiate Google OAuth flow
 * Opens popup or redirects to Google login
 */
export async function initiateGoogleOAuth(
  apiBase: string,
  redirectTo?: string,
  usePopup: boolean = false
): Promise<void> {
  try {
    // Call backend to get Google OAuth URL
    const response = await fetch(`${apiBase}/authentication/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      throw new Error(`Failed to initiate OAuth: ${response.status}`)
    }

    const data = await response.json()
    const { auth_url, state } = data

    if (!auth_url || !state) {
      throw new Error("Invalid response from OAuth initiate endpoint")
    }

    // Store state for validation when callback returns
    setOAuthState(redirectTo)

    // Redirect to Google (or open popup)
    if (usePopup) {
      // Popup flow (optional, more complex)
      const width = 500
      const height = 600
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      window.open(
        auth_url,
        "Google OAuth",
        `width=${width},height=${height},left=${left},top=${top}`
      )
    } else {
      // Redirect flow (recommended for simplicity)
      window.location.href = auth_url
    }
  } catch (error) {
    console.error("Failed to initiate Google OAuth:", error)
    throw error
  }
}
```

---

### Task 2: Create OAuth Callback Page

**File to create:** `frontend/app/auth/google/callback/page.tsx`

This page handles the redirect from Google after user authenticates.

```typescript
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { getApiBase } from "@/lib/api"
import { validateOAuthState, clearOAuthState } from "@/lib/oauth"

export default function GoogleCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    async function handleCallback() {
      try {
        // Extract parameters from URL
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")

        // Check for OAuth errors from Google
        if (error) {
          throw new Error(`Google OAuth error: ${error}`)
        }

        if (!code || !state) {
          throw new Error("Missing authorization code or state parameter")
        }

        // Validate state (CSRF protection)
        const storedState = validateOAuthState(state)
        if (!storedState) {
          throw new Error("Invalid or expired OAuth state")
        }

        // Exchange code for JWT token via backend
        const response = await fetch(`${getApiBase()}/authentication/google/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`OAuth callback failed: ${errorText.slice(0, 200)}`)
        }

        // Backend returns {"data": "JWT_TOKEN"}
        const result = await response.json()
        const token = result.data

        if (!token || typeof token !== "string") {
          throw new Error("Invalid token received from server")
        }

        // Store token and update auth context
        login(token)

        // Clean up OAuth state
        clearOAuthState()

        // Redirect to intended destination or default to /home
        const redirectTo = storedState.redirectTo || "/home"
        router.push(redirectTo)
      } catch (err: any) {
        console.error("OAuth callback error:", err)
        setError(err?.message || "Authentication failed. Please try again.")
        setIsProcessing(false)

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login?error=oauth_failed")
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, login, router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-lg border p-6">
          <h1 className="mb-2 text-xl font-bold text-red-600">
            Authentication Failed
          </h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="mt-4 text-sm">Redirecting to login page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-muted-foreground">
          {isProcessing ? "Completing authentication..." : "Redirecting..."}
        </p>
      </div>
    </div>
  )
}
```

---

### Task 3: Update Login Form Component

**File to modify:** `frontend/components/marketing/LoginForm.tsx`

Update the existing "Login with Google" button (currently at line 135-138) to actually work:

```typescript
// Add this import at the top
import { initiateGoogleOAuth } from "@/lib/oauth"
import { getApiBase } from "@/lib/api"

// Replace the Google button (around line 135) with this:
<Field>
  <Button
    variant="outline"
    type="button"
    onClick={async () => {
      try {
        await initiateGoogleOAuth(getApiBase(), "/home")
      } catch (err) {
        setError("Failed to start Google sign in. Please try again.")
      }
    }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      {/* ... existing Google icon SVG ... */}
    </svg>
    Login with Google
  </Button>
  {/* ... rest of form ... */}
</Field>
```

**Changes:**
1. Add `onClick` handler to the button
2. Call `initiateGoogleOAuth()` which redirects to Google
3. Handle errors by setting error state

---

### Task 4: Update Signup Form Component

**File to modify:** `frontend/components/marketing/SignupForm.tsx`

Add the same Google OAuth button to the signup form (similar to LoginForm).

**Pattern to follow:**
1. Import `initiateGoogleOAuth` from `@/lib/oauth`
2. Add a "Sign up with Google" button with `onClick` handler
3. Call `initiateGoogleOAuth(getApiBase(), "/home")`
4. Place it after the existing form fields, likely with a separator like "Or continue with"

**Example structure:**
```typescript
<FieldSeparator>Or continue with</FieldSeparator>
<Field>
  <Button
    variant="outline"
    type="button"
    onClick={async () => {
      try {
        await initiateGoogleOAuth(getApiBase(), "/home")
      } catch (err) {
        setError("Failed to start Google sign up. Please try again.")
      }
    }}
  >
    {/* Google icon SVG */}
    Sign up with Google
  </Button>
</Field>
```

---

### Task 5: Update Environment Configuration

**File to update:** `frontend/.env.local`

Ensure the API URL is configured:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/v1
```

**Note:** In production, update this to your production API URL.

---

### Task 6: Add OAuth Redirect URI to Google Console

**Manual configuration step** (not code):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "Credentials" → Select your OAuth 2.0 Client ID
4. Add these Authorized redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://your-domain.com/auth/google/callback`

**Important:** The redirect URI must match exactly, including the protocol and path.

---

## User Flow

### Scenario 1: New User Signs Up with Google

1. User clicks "Sign up with Google" on `/signup`
2. Frontend calls `POST /v1/authentication/google` → receives OAuth URL
3. User redirected to Google → authenticates and authorizes
4. Google redirects to `http://localhost:3000/auth/google/callback?code=...&state=...`
5. Callback page extracts code and state
6. Frontend calls `POST /v1/authentication/google/callback` with code and state
7. Backend creates new user (auto-activated, no password) → returns JWT
8. Frontend stores JWT, updates auth context → redirects to `/home`

**Result:** User is logged in with a new account linked to their Google account.

---

### Scenario 2: Existing User Logs In with Google

1. User clicks "Login with Google" on `/login`
2. OAuth flow (same as above)
3. Backend finds user by Google ID → returns JWT
4. User logged in

**Result:** Existing Google user logs in seamlessly.

---

### Scenario 3: Existing Email/Password User Uses Google (Account Linking)

1. User with email `user@example.com` created via email/password signup
2. User clicks "Login with Google" using the same email `user@example.com`
3. OAuth flow proceeds
4. Backend finds user by email (not Google ID)
5. **Backend automatically links Google account to existing user**
6. Backend returns JWT
7. User logged in

**Result:** Google account now linked. User can login with either email/password OR Google in future.

---

## Error Handling

### Common Errors to Handle

1. **User cancels Google login:**
   - Google redirects with `?error=access_denied`
   - Show message: "Google sign in was cancelled"
   - Redirect to login page

2. **State mismatch (CSRF attempt):**
   - Show message: "Security validation failed. Please try again."
   - Clear stored state
   - Redirect to login page

3. **Backend error (network, server):**
   - Show message: "Authentication failed. Please try again."
   - Log error for debugging
   - Provide option to retry or use email/password

4. **Invalid/expired authorization code:**
   - Show message: "Session expired. Please try again."
   - Redirect to login page

---

## Testing Checklist

### Manual Testing

- [ ] **New user signup via Google**
  - Click "Sign up with Google" → redirected to Google
  - Authorize → redirected back to app
  - Logged in successfully → redirected to `/home`
  - Check backend: User created with `google_id` populated

- [ ] **Existing Google user login**
  - Logout
  - Click "Login with Google"
  - Logged in immediately without signup

- [ ] **Account linking (email match)**
  - Create user via email/password with `test@example.com`
  - Logout
  - Click "Login with Google" with same email
  - Logged in successfully
  - Check backend: User's `google_id` now populated

- [ ] **User cancels OAuth**
  - Click Google button → click "Cancel" on Google screen
  - Returned to login page with appropriate message

- [ ] **Error handling**
  - Network error: Disconnect internet, try OAuth → error shown
  - Invalid state: Manually tamper with state → error shown

- [ ] **Token storage and session**
  - Login with Google → JWT stored in localStorage
  - Refresh page → still logged in
  - Token expiry → auto-refresh works

---

## Security Considerations

### CSRF Protection
- ✅ State parameter generated and validated on callback
- ✅ State stored in sessionStorage (cleared after use)
- ✅ State expires after 10 minutes

### Token Security
- ✅ JWT tokens stored in localStorage (consistent with existing auth)
- ✅ Tokens auto-refresh before expiry (existing mechanism in `lib/auth.tsx`)
- ✅ Backend validates Google user info and email verification

### XSS Protection
- ✅ Next.js auto-escapes output
- ✅ No `dangerouslySetInnerHTML` used
- ✅ OAuth parameters sanitized before use

---

## Code Organization Summary

```
frontend/
├── app/
│   ├── auth/
│   │   └── google/
│   │       └── callback/
│   │           └── page.tsx        # NEW: OAuth callback handler
│   ├── login/
│   │   └── page.tsx                # Existing (no changes needed)
│   └── signup/
│       └── page.tsx                # Existing (no changes needed)
├── components/
│   └── marketing/
│       ├── LoginForm.tsx           # MODIFY: Add Google button handler
│       └── SignupForm.tsx          # MODIFY: Add Google button handler
└── lib/
    ├── api.ts                      # Existing (no changes)
    ├── auth.tsx                    # Existing (no changes needed)
    └── oauth.ts                    # NEW: OAuth state management
```

---

## Additional Notes

### Why This Approach?

1. **Minimal changes:** Reuses existing auth infrastructure (`lib/auth.tsx`)
2. **Security-first:** Implements CSRF protection via state parameter
3. **User-friendly:** Auto-linking prevents duplicate accounts
4. **Consistent:** OAuth tokens work identically to email/password tokens

### Future Enhancements (Out of Scope)

- Add other OAuth providers (GitHub, Microsoft, etc.)
- Implement popup flow instead of redirect (better UX but more complex)
- Add profile picture display from `avatar_url` field
- Allow users to unlink Google account in settings

---

## Questions?

If you encounter issues or have questions during implementation, check:

1. **Network errors:** Verify `NEXT_PUBLIC_API_URL` is correct in `.env.local`
2. **Redirect URI mismatch:** Ensure Google Console redirect URI matches exactly
3. **State errors:** Check browser console for OAuth state validation logs
4. **Token errors:** Review backend logs for detailed error messages

**Backend team contact:** The backend implementation is complete and tested. If you find backend issues, report with:
- Request/response details
- Browser console errors
- Expected vs actual behavior

---

## Summary

**Files to Create:** 2
- `frontend/lib/oauth.ts`
- `frontend/app/auth/google/callback/page.tsx`

**Files to Modify:** 2
- `frontend/components/marketing/LoginForm.tsx`
- `frontend/components/marketing/SignupForm.tsx`

**Configuration:** 1
- Google Cloud Console redirect URI setup

**Estimated Effort:** 4-6 hours for full implementation and testing

**Backend Dependency:** ✅ Complete (no backend changes needed)
