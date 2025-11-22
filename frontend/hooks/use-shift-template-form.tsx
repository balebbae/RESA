"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"

// Time validation helper - validates HH:MM format
const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

const shiftTemplateSchema = z.object({
  name: z.string().max(255, "Name must be 255 characters or less").optional().or(z.literal("")),
  role_ids: z.array(z.number().int().positive()).min(1, "Please select at least one role"),
  day_of_week: z.number().int().min(0).max(6, "Day must be between 0 (Sunday) and 6 (Saturday)"),
  start_time: z.string().regex(timeRegex, "Start time must be in HH:MM format (e.g., 09:00)"),
  end_time: z.string().regex(timeRegex, "End time must be in HH:MM format (e.g., 17:00)"),
}).refine((data) => {
  // Ensure end_time is after start_time
  const [startHour, startMin] = data.start_time.split(':').map(Number)
  const [endHour, endMin] = data.end_time.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  return endMinutes > startMinutes
}, {
  message: "End time must be after start time",
  path: ["end_time"],
})

export interface ShiftTemplateFormData {
  name?: string
  role_ids: number[]
  day_of_week: number
  start_time: string
  end_time: string
}

export interface UseShiftTemplateFormOptions {
  mode?: "create" | "edit"
  restaurantId: number | null
  shiftTemplateId?: number
  onSuccess?: (shiftTemplate: unknown) => void
  isOpen?: boolean
}

/**
 * Custom hook for shift template form management (create/edit)
 * Handles form state, validation, and API calls
 */
export function useShiftTemplateForm({
  mode = "create",
  restaurantId,
  shiftTemplateId,
  onSuccess,
  isOpen = false,
}: UseShiftTemplateFormOptions) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control,
  } = useForm<ShiftTemplateFormData>({
    resolver: zodResolver(shiftTemplateSchema),
    defaultValues: {
      name: "",
      role_ids: [],
      day_of_week: 0,
      start_time: "09:00",
      end_time: "17:00",
    },
  })

  const onSubmit = async (data: ShiftTemplateFormData) => {
    setError(null)

    try {
      if (!restaurantId) {
        throw new Error("Restaurant ID is required")
      }

      if (mode === "edit" && !shiftTemplateId) {
        throw new Error("Shift template ID is required for updating")
      }

      const payload = {
        name: data.name || undefined, // Send undefined if empty string to omit from JSON
        role_ids: data.role_ids,
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
      }

      const isEdit = mode === "edit"
      const endpoint = isEdit
        ? `${getApiBase()}/restaurants/${restaurantId}/shift-templates/${shiftTemplateId}`
        : `${getApiBase()}/restaurants/${restaurantId}/shift-templates`
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetchWithAuth(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let message = `Failed to ${isEdit ? "update" : "create"} shift template`
        try {
          const text = await res.text()
          message = text.slice(0, 300)
        } catch {}
        throw new Error(`${message} (${res.status})`)
      }

      const shiftTemplate = await res.json()

      reset()

      if (onSuccess) {
        onSuccess(shiftTemplate)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    }
  }

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    isLoading,
    error,
    reset,
    setValue,
    watch,
    control,
  }
}
