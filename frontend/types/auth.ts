/**
 * Authentication type definitions
 */

/**
 * JWT token payload
 * Decoded from auth token
 */
export interface AuthUser {
  sub: number // User ID
  exp: number
  iat: number
  nbf: number
  iss: string
  aud: string
  email?: string
  first_name?: string
  last_name?: string
}

/**
 * Auth context type for React context provider
 */
export interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
  refreshToken: () => Promise<void>
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Signup data
 */
export interface SignupData {
  email: string
  first_name?: string
  last_name?: string
}

/**
 * Auth token response from API
 */
export interface AuthTokenResponse {
  data: string // JWT token
}
