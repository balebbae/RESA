"use client"

import { useState, useEffect, useCallback } from "react"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import type { ShiftTemplate, UseShiftTemplatesReturn } from "@/types/shift-template"

/**
 * Custom hook to fetch and manage shift templates for a specific restaurant
 * Similar to use-roles but for shift templates
 */
export function useShiftTemplates(restaurantId: number | null): UseShiftTemplatesReturn {
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchShiftTemplates = useCallback(async () => {
    if (!restaurantId) {
      setShiftTemplates([])
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const res = await fetchWithAuth(`${getApiBase()}/restaurants/${restaurantId}/shift-templates`)

      if (!res.ok) {
        throw new Error(`Failed to fetch shift templates (${res.status})`)
      }

      const data = await res.json()

      // Handle both array response and {data: []} format
      const templatesData = Array.isArray(data) ? data : (data.data || [])

      // Validate that all shift templates have required fields
      const validTemplates = templatesData.filter((template: ShiftTemplate) => {
        return (
          typeof template.id === "number" &&
          typeof template.restaurant_id === "number" &&
          typeof template.day_of_week === "number" &&
          typeof template.start_time === "string" &&
          typeof template.end_time === "string" &&
          typeof template.created_at === "string" &&
          typeof template.updated_at === "string"
        )
      })

      setShiftTemplates(validTemplates)
    } catch (err) {
      console.error("Error fetching shift templates:", err)
      setError(err instanceof Error ? err.message : "Failed to load shift templates")
      setShiftTemplates([])
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchShiftTemplates()
  }, [fetchShiftTemplates])

  return {
    shiftTemplates,
    isLoading,
    error,
    refetch: fetchShiftTemplates,
  }
}
