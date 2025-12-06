"use client"

import { useState, useEffect, useCallback } from "react"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import type { Role } from "@/types/role"

export interface UseRolesReturn {
  roles: Role[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook to fetch and manage roles for a specific restaurant
 * Similar to use-employees but for roles
 */
export function useRoles(restaurantId: number | null): UseRolesReturn {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRoles = useCallback(async () => {
    if (!restaurantId) {
      setRoles([])
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const res = await fetchWithAuth(`${getApiBase()}/restaurants/${restaurantId}/roles`)

      if (!res.ok) {
        throw new Error(`Failed to fetch roles (${res.status})`)
      }

      const data = await res.json()

      // Handle both array response and {data: []} format
      const rolesData = Array.isArray(data) ? data : (data.data || [])

      // Validate that all roles have required fields
      const validRoles = rolesData.filter((role: Role) => {
        return (
          typeof role.id === "number" &&
          typeof role.restaurant_id === "number" &&
          typeof role.name === "string" &&
          typeof role.created_at === "string" &&
          typeof role.updated_at === "string"
        )
      })

      setRoles(validRoles)
    } catch (err) {
      console.error("Error fetching roles:", err)
      setError(err instanceof Error ? err.message : "Failed to load roles")
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  return {
    roles,
    isLoading,
    error,
    refetch: fetchRoles,
  }
}
