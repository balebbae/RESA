"use client"

import { useState, useEffect, useCallback } from "react"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import type { Event, UseEventsReturn, UseEventsOptions } from "@/types/event"
import type { Employee } from "@/types/employee"

/**
 * Custom hook for fetching events for a specific restaurant
 * Supports optional date range filtering for calendar views
 */
export function useEvents(
  restaurantId: number | null,
  options?: UseEventsOptions
): UseEventsReturn {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!restaurantId) {
      setEvents([])
      setIsLoading(false)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Build URL with optional query params
      let apiUrl = `${getApiBase()}/restaurants/${restaurantId}/events`
      const params = new URLSearchParams()
      if (options?.startDate) params.append("start_date", options.startDate)
      if (options?.endDate) params.append("end_date", options.endDate)
      if (params.toString()) apiUrl += `?${params.toString()}`

      const res = await fetchWithAuth(apiUrl)

      if (!res.ok) {
        throw new Error(`Failed to fetch events (${res.status})`)
      }

      const data = await res.json()
      const eventList = Array.isArray(data) ? data : data.data || []

      // Ensure all events have required fields
      const validEvents: Event[] = eventList
        .filter((evt: unknown) => evt && typeof evt === "object" && "id" in evt)
        .map((evt: unknown) => {
          const e = evt as Record<string, unknown>
          return {
            id: e.id as number,
            restaurant_id: e.restaurant_id as number,
            title: (e.title as string) || "Untitled Event",
            description: (e.description as string) || "",
            date: e.date as string,
            start_time: e.start_time as string,
            end_time: e.end_time as string,
            created_at: e.created_at as string,
            updated_at: e.updated_at as string,
            employees: (e.employees as Employee[]) || [],
          }
        })

      setEvents(validEvents)
    } catch (err) {
      console.error("Error fetching events:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch events")
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId, options?.startDate, options?.endDate])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
  }
}
