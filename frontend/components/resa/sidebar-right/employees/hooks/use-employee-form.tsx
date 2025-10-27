"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import type { EmployeeFormData } from "@/components/resa/sidebar-right/types/employee"

const employeeSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(255, "Name must be less than 255 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email format").max(255, "Email must be less than 255 characters"),
})

export interface UseEmployeeFormOptions {
  mode?: "create" | "edit"
  restaurantId: number | null
  employeeId?: number
  onSuccess?: (employee: unknown) => void
  isOpen?: boolean
}

/**
 * Custom hook for employee form management (create/edit)
 * Handles form state, validation, and API calls
 * Similar to use-workspace-form but for employees
 */
export function useEmployeeForm({
  mode = "create",
  restaurantId,
  employeeId,
  onSuccess,
  isOpen = false,
}: UseEmployeeFormOptions) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      full_name: "",
      email: "",
    },
  })

  // Fetch employee data when in edit mode and dialog opens
  useEffect(() => {
    if (mode === "edit" && restaurantId && employeeId && isOpen) {
      const fetchEmployee = async () => {
        try {
          setIsLoading(true)
          setError(null)
          const res = await fetchWithAuth(`${getApiBase()}/restaurants/${restaurantId}/employees/${employeeId}`)

          if (!res.ok) {
            throw new Error(`Failed to fetch employee (${res.status})`)
          }

          const response = await res.json()
          const employee = response.data || response

          reset({
            full_name: employee.full_name || "",
            email: employee.email || "",
          })
        } catch (err) {
          console.error("Error fetching employee:", err)
          setError(err instanceof Error ? err.message : "Failed to load employee details")
        } finally {
          setIsLoading(false)
        }
      }

      fetchEmployee()
    }
  }, [mode, restaurantId, employeeId, isOpen, reset])

  const onSubmit = async (data: EmployeeFormData) => {
    setError(null)

    try {
      if (!restaurantId) {
        throw new Error("Restaurant ID is required")
      }

      if (mode === "edit" && !employeeId) {
        throw new Error("Employee ID is required for updating")
      }

      const payload = {
        full_name: data.full_name,
        email: data.email,
      }

      const isEdit = mode === "edit"
      const endpoint = isEdit
        ? `${getApiBase()}/restaurants/${restaurantId}/employees/${employeeId}`
        : `${getApiBase()}/restaurants/${restaurantId}/employees`
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetchWithAuth(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let message = `Failed to ${isEdit ? "update" : "create"} employee`
        try {
          const text = await res.text()
          message = text.slice(0, 300)
        } catch {}
        throw new Error(`${message} (${res.status})`)
      }

      const employee = await res.json()

      reset()

      if (onSuccess) {
        onSuccess(employee)
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
  }
}
