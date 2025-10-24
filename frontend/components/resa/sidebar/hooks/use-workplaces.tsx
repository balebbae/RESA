"use client"

import { useState, useEffect, useCallback } from "react"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import type { Workspace, UseWorkspacesReturn } from "../types/workspace"

/**
 * Custom hook for fetching and managing workplaces (restaurants)
 * Extracts API logic from components for better separation of concerns
 */
export function useWorkplaces(): UseWorkspacesReturn {
  const [workplaces, setWorkplaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkplaces = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const apiUrl = `${getApiBase()}/restaurants`

      const res = await fetchWithAuth(apiUrl)

      if (!res.ok) {
        throw new Error(`Failed to fetch restaurants (${res.status})`)
      }

      const data = await res.json()
      const restaurantList = Array.isArray(data) ? data : (data.data || [])

      // Convert restaurants to workspaces format
      const convertedWorkplaces: Workspace[] = restaurantList
        .filter((restaurant: any) => restaurant && restaurant.id)
        .map((restaurant: any) => ({
          id: restaurant.id,
          name: restaurant.name || "Unnamed Restaurant",
          address: restaurant.address,
          phone: restaurant.phone,
          emoji: "🏢",
          pages: [],
          createdAt: restaurant.created_at,
          updatedAt: restaurant.updated_at,
        }))

      setWorkplaces(convertedWorkplaces)
    } catch (err: any) {
      console.error("Error fetching workplaces:", err)
      setError(err?.message || "Failed to fetch workplaces")
      setWorkplaces([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkplaces()
  }, [fetchWorkplaces])

  return {
    workplaces,
    isLoading,
    error,
    refetch: fetchWorkplaces,
  }
}
