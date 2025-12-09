"use client"

import { useState, useCallback } from "react"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"

/**
 * Result from the send schedule email API
 */
export interface SendScheduleResult {
  total_recipients: number
  successful: number
  failed: number
  failures: SendScheduleFailure[]
}

export interface SendScheduleFailure {
  employee_id: number
  employee_name: string
  email: string
  error: string
}

interface UseSendScheduleOptions {
  onSuccess?: (result: SendScheduleResult) => void
  onError?: (error: string) => void
}

interface UseSendScheduleReturn {
  sendSchedule: (
    restaurantId: number,
    scheduleId: number,
    includeEvents: boolean
  ) => Promise<SendScheduleResult | undefined>
  isSending: boolean
  error: string | null
  clearError: () => void
}

/**
 * Hook for sending schedule emails to employees
 */
export function useSendSchedule(
  options?: UseSendScheduleOptions
): UseSendScheduleReturn {
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const sendSchedule = useCallback(
    async (
      restaurantId: number,
      scheduleId: number,
      includeEvents: boolean
    ): Promise<SendScheduleResult | undefined> => {
      setIsSending(true)
      setError(null)

      try {
        const response = await fetchWithAuth(
          `${getApiBase()}/restaurants/${restaurantId}/schedules/${scheduleId}/send-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ include_events: includeEvents }),
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = "Failed to send schedule"
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.error || errorJson.message || errorMessage
          } catch {
            if (errorText) errorMessage = errorText
          }
          throw new Error(errorMessage)
        }

        const result: SendScheduleResult = await response.json()
        options?.onSuccess?.(result)
        return result
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send schedule"
        setError(message)
        options?.onError?.(message)
        return undefined
      } finally {
        setIsSending(false)
      }
    },
    [options]
  )

  return { sendSchedule, isSending, error, clearError }
}
