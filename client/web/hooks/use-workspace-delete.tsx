"use client"

import { useState } from "react"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import { showErrorToast } from "@/lib/utils/toast-helpers"

export interface UseWorkspaceDeleteOptions {
  onSuccess?: () => void
}

/**
 * Custom hook for workspace deletion
 * Handles delete confirmation and API call
 */
export function useWorkspaceDelete({ onSuccess }: UseWorkspaceDeleteOptions = {}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteWorkspace = async (workspaceId: number) => {
    if (!workspaceId) {
      setError("Workspace ID is required for deletion")
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const endpoint = `${getApiBase()}/restaurants/${workspaceId}`

      const res = await fetchWithAuth(endpoint, {
        method: "DELETE",
      })

      if (!res.ok) {
        let message = "Failed to delete workspace"
        try {
          const text = await res.text()
          message = text.slice(0, 300)
        } catch {}
        throw new Error(`${message} (${res.status})`)
      }

      // Success - workspace deleted (204 No Content)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to delete workspace. Please try again."
      setError(msg)
      showErrorToast(msg)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    isDeleting,
    error,
    deleteWorkspace,
    setError,
  }
}
