/**
 * Calendar and schedule type definitions for right sidebar
 */

export interface CalendarItem {
  id?: string
  name: string
  active?: boolean
}

export interface Calendar {
  id?: string
  name: string
  items: CalendarItem[]
}

export interface UseCalendarsReturn {
  calendars: Calendar[]
  isLoading: boolean
  error: string | null
}
