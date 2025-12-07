"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getApiBase } from "./api"

/**
 * Centralized authentication and session management
 * Combines token utilities with React context for state management
 */

// ============================================================================
// Constants
// ============================================================================

const AUTH_TOKEN_KEY = "auth_token"
const TOKEN_EXPIRY_KEY = "token_expiry"

// ============================================================================
// Types
// ============================================================================

export interface User {
  sub: number // User ID
  exp: number
  iat: number
  nbf: number
  iss: string
  aud: string
  email?: string
  first_name?: string
  last_name?: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
  refreshToken: () => Promise<void>
}

// ============================================================================
// Token Utilities
// ============================================================================

/**
 * Decode JWT token (basic decode without verification)
 * Use only for reading non-sensitive data like user ID, email, etc.
 */
export function decodeToken(token: string | null | undefined): User | null {
  if (!token || typeof token !== "string") {
    console.error("Invalid token provided to decodeToken:", token)
    return null
  }

  try {
    const base64Url = token.split(".")[1]
    if (!base64Url) {
      console.error("Invalid token format - missing payload section")
      return null
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error("Failed to decode token:", error)
    return null
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token?: string): boolean {
  const authToken = token || getAuthToken()
  if (!authToken) {
    return true
  }

  const decoded = decodeToken(authToken)
  if (!decoded || !decoded.exp) {
    return true
  }

  // Check if token expiration time has passed
  const currentTime = Math.floor(Date.now() / 1000)
  return decoded.exp < currentTime
}

/**
 * Store authentication token in localStorage
 * Also calculates and stores expiry time
 */
export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    if (!token) {
      console.error("Attempted to set empty token")
      return
    }

    // Ensure token is a string and clean it - remove quotes if API returns it as JSON string
    const tokenString = typeof token === "string" ? token : String(token)
    const cleanToken = tokenString.replace(/^"|"$/g, "").trim()

    // Validate JWT format (should have 3 parts: header.payload.signature)
    const parts = cleanToken.split(".")
    if (parts.length !== 3) {
      console.error(
        `Invalid JWT format. Expected 3 parts, got ${parts.length}. Token: "${cleanToken.substring(0, 50)}..."`
      )
      return
    }

    console.log("Setting auth token, length:", cleanToken.length)
    localStorage.setItem(AUTH_TOKEN_KEY, cleanToken)

    // Decode and store expiry time
    const decoded = decodeToken(cleanToken)
    if (decoded?.exp) {
      localStorage.setItem(TOKEN_EXPIRY_KEY, decoded.exp.toString())
      console.log("Token decoded successfully, expires at:", new Date(decoded.exp * 1000))
    } else {
      console.error("Failed to decode token or token has no expiry")
    }
  }
}

/**
 * Retrieve authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  }
  return null
}

/**
 * Remove authentication token from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken()
  return token !== null && !isTokenExpired(token)
}

/**
 * Get current user info from token
 */
export function getCurrentUser(): User | null {
  const token = getAuthToken()
  if (!token) {
    return null
  }
  return decodeToken(token)
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  if (!token) {
    throw new Error("No authentication token found. Please log in.")
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

/**
 * Refresh the authentication token
 */
export async function refreshAuthToken(apiBase: string): Promise<string> {
  const token = getAuthToken()

  if (!token) {
    throw new Error("No authentication token found. Please log in.")
  }

  const response = await fetch(`${apiBase}/authentication/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    clearAuthToken()
    throw new Error("Failed to refresh token. Please log in again.")
  }

  // API returns {"data": "JWT_TOKEN"}
  const responseData = await response.json()
  const newToken = responseData.data

  if (!newToken || typeof newToken !== "string") {
    throw new Error("Invalid token received from refresh endpoint")
  }

  setAuthToken(newToken)
  return newToken
}

/**
 * Make an authenticated API request with automatic token refresh
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  skipRetry: boolean = false
): Promise<Response> {
  const token = getAuthToken()

  if (!token) {
    throw new Error("No authentication token found. Please log in.")
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle 401 unauthorized - try to refresh token once
  if (response.status === 401 && !skipRetry) {
    try {
      // Extract API base from URL
      const apiBase =
        url.split("/authentication")[0].split("/restaurants")[0].split("/users")[0]

      // Try to refresh the token
      await refreshAuthToken(apiBase)

      // Retry the request with new token
      return fetchWithAuth(url, options, true)
    } catch (error) {
      // Refresh failed, clear token and throw
      clearAuthToken()
      throw new Error("Session expired. Please log in again.")
    }
  }

  return response
}

// ============================================================================
// React Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state on mount
  useEffect(() => {
    const token = getAuthToken()

    if (!token || isTokenExpired(token)) {
      clearAuthToken()
      setUser(null)
      setIsLoading(false)
      return
    }

    // Decode token and set user
    const userData = getCurrentUser()
    setUser(userData)
    setIsLoading(false)
  }, [])

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user?.exp) return

    const expiryTime = user.exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()
    const timeUntilExpiry = expiryTime - currentTime

    // Refresh at 80% of token lifetime
    const refreshTime = timeUntilExpiry * 0.8

    if (refreshTime > 0) {
      const timer = setTimeout(async () => {
        try {
          await handleRefreshToken()
        } catch (error) {
          console.error("Auto-refresh failed:", error)
          handleLogout()
        }
      }, refreshTime)

      return () => clearTimeout(timer)
    }
  }, [user])

  const handleLogin = (token: string) => {
    setAuthToken(token)
    const userData = getCurrentUser()
    setUser(userData)
  }

  const handleLogout = () => {
    clearAuthToken()
    setUser(null)
    router.push("/login")
  }

  const handleRefreshToken = async () => {
    try {
      await refreshAuthToken(getApiBase())
      const userData = getCurrentUser()
      setUser(userData)
    } catch (error) {
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !isTokenExpired(),
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    refreshToken: handleRefreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
