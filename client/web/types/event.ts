import type { Employee } from "./employee"

/**
 * Event type definitions for restaurant events
 * Events are distinct from shifts - they represent special occasions,
 * meetings, or other time-bound activities
 */

export interface Event {
  id: number
  restaurant_id: number
  title: string
  description: string
  date: string // YYYY-MM-DD format
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  created_at: string
  updated_at: string
  employees?: Employee[]
}

export interface UseEventsReturn {
  events: Event[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseEventsOptions {
  startDate?: string // YYYY-MM-DD - filter events from this date
  endDate?: string // YYYY-MM-DD - filter events until this date
}
