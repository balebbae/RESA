"use client"

import { useState } from "react"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"

export interface UseRoleDeleteOptions {
  restaurantId: number | null
  onSuccess?: () => void
}

export interface UseRoleDeleteReturn {
  isDeleting: boolean
  error: string | null
  deleteRole: (roleId: number) => Promise<void>
  setError: (error: string | null) => void
}

/**
 * Custom hook for deleting roles
 * Similar to use-employee-delete but for roles
 */
export function useRoleDelete({
  restaurantId,
  onSuccess,
}: UseRoleDeleteOptions): UseRoleDeleteReturn {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteRole = async (roleId: number) => {
    if (!restaurantId) {
      setError("Restaurant ID is required")
      return
    }

    if (!roleId) {
      setError("Role ID is required")
      return
    }

    try {
      setIsDeleting(true)
      setError(null)

      const res = await fetchWithAuth(
        `${getApiBase()}/restaurants/${restaurantId}/roles/${roleId}`,
        {
          method: "DELETE",
        }
      )

      if (!res.ok) {
        let message = "Failed to delete role"
        try {
          const text = await res.text()
          if (text) {
            message = text.slice(0, 300)
          }
        } catch {}
        throw new Error(`${message} (${res.status})`)
      }

      // 204 No Content - successful deletion
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete role"
      setError(errorMessage)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    isDeleting,
    error,
    deleteRole,
    setError,
  }
}
