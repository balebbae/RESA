/**
 * Common API response type definitions
 */

/**
 * Standard API error response
 */
export interface ApiError {
  error: string
  message?: string
  status?: number
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
  }
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  message?: string
}

/**
 * API request options
 */
export interface ApiRequestOptions extends RequestInit {
  skipRetry?: boolean
}
