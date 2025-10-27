"use client"

import { useState, useEffect } from "react"
import type { Calendar, UseCalendarsReturn } from "../types/calendar"

// TODO: Replace with actual API data when backend is ready
const SAMPLE_CALENDARS: Calendar[] = [
  {
    name: "My Calendars",
    items: [
      { name: "Personal", active: true },
      { name: "Work", active: true },
      { name: "Family", active: false },
    ],
  },
  {
    name: "Favorites",
    items: [
      { name: "Holidays", active: false },
      { name: "Birthdays", active: false },
    ],
  },
  {
    name: "Other",
    items: [
      { name: "Travel", active: false },
      { name: "Reminders", active: false },
      { name: "Deadlines", active: false },
    ],
  },
]

/**
 * Custom hook for fetching calendar data in right sidebar
 * Currently returns sample data, but prepared for API integration
 */
export function useCalendars(): UseCalendarsReturn {
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API call
    const loadCalendars = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // TODO: Replace with actual API call
        // const res = await fetchWithAuth(`${getApiBase()}/calendars`)
        // const data = await res.json()
        // setCalendars(data)

        // For now, use sample data
        await new Promise((resolve) => setTimeout(resolve, 100))
        setCalendars(SAMPLE_CALENDARS)
      } catch (err: any) {
        console.error("Error loading calendars:", err)
        setError(err?.message || "Failed to load calendars")
        setCalendars([])
      } finally {
        setIsLoading(false)
      }
    }

    loadCalendars()
  }, [])

  return {
    calendars,
    isLoading,
    error,
  }
}
