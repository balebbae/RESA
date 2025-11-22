"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import type { RoleFormData } from "@/types/role"

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(50, "Role name must be less than 50 characters"),
})

export interface UseRoleFormOptions {
  mode?: "create" | "edit"
  restaurantId: number | null
  roleId?: number
  onSuccess?: (role: unknown) => void
  isOpen?: boolean
}

/**
 * Custom hook for role form management (create/edit)
 * Handles form state, validation, and API calls
 * Similar to use-employee-form but simpler (only name field)
 */
export function useRoleForm({
  mode = "create",
  restaurantId,
  roleId,
  onSuccess,
  isOpen = false,
}: UseRoleFormOptions) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
    },
  })

  // Fetch role data when in edit mode and dialog opens
  useEffect(() => {
    if (mode === "edit" && restaurantId && roleId && isOpen) {
      const fetchRole = async () => {
        try {
          setIsLoading(true)
          setError(null)
          const res = await fetchWithAuth(`${getApiBase()}/restaurants/${restaurantId}/roles/${roleId}`)

          if (!res.ok) {
            throw new Error(`Failed to fetch role (${res.status})`)
          }

          const response = await res.json()
          const role = response.data || response

          reset({
            name: role.name || "",
          })
        } catch (err) {
          console.error("Error fetching role:", err)
          setError(err instanceof Error ? err.message : "Failed to load role details")
        } finally {
          setIsLoading(false)
        }
      }

      fetchRole()
    }
  }, [mode, restaurantId, roleId, isOpen, reset])

  const onSubmit = async (data: RoleFormData) => {
    setError(null)

    try {
      if (!restaurantId) {
        throw new Error("Restaurant ID is required")
      }

      if (mode === "edit" && !roleId) {
        throw new Error("Role ID is required for updating")
      }

      const payload = {
        name: data.name,
      }

      const isEdit = mode === "edit"
      const endpoint = isEdit
        ? `${getApiBase()}/restaurants/${restaurantId}/roles/${roleId}`
        : `${getApiBase()}/restaurants/${restaurantId}/roles`
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetchWithAuth(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let message = `Failed to ${isEdit ? "update" : "create"} role`
        try {
          const text = await res.text()
          message = text.slice(0, 300)
        } catch {}
        throw new Error(`${message} (${res.status})`)
      }

      const role = await res.json()

      reset()

      if (onSuccess) {
        onSuccess(role)
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
