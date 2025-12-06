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
export function setOAuthState(state: string, redirectTo?: string): string {
  if (typeof window === "undefined") return ""

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

    const result = await response.json()
    // Backend wraps response in envelope: { "data": { "auth_url": "...", "state": "..." } }
    const data = result.data

    if (!data || !data.auth_url || !data.state) {
      throw new Error("Invalid response from OAuth initiate endpoint")
    }

    const { auth_url, state } = data

    // Store state for validation when callback returns
    setOAuthState(state, redirectTo)

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
