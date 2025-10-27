"use client"

import { useState } from "react"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"

export interface UseEmployeeDeleteOptions {
  restaurantId: number | null
  onSuccess?: () => void
}

/**
 * Custom hook for employee deletion
 * Handles delete confirmation and API call
 */
export function useEmployeeDelete({ restaurantId, onSuccess }: UseEmployeeDeleteOptions) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteEmployee = async (employeeId: number) => {
    if (!restaurantId) {
      setError("Restaurant ID is required for deletion")
      return
    }

    if (!employeeId) {
      setError("Employee ID is required for deletion")
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const endpoint = `${getApiBase()}/restaurants/${restaurantId}/employees/${employeeId}`

      const res = await fetchWithAuth(endpoint, {
        method: "DELETE",
      })

      if (!res.ok) {
        let message = "Failed to delete employee"
        try {
          const text = await res.text()
          message = text.slice(0, 300)
        } catch {}
        throw new Error(`${message} (${res.status})`)
      }

      // Success - employee deleted (204 No Content)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete employee. Please try again.")
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    isDeleting,
    error,
    deleteEmployee,
    setError,
  }
}
