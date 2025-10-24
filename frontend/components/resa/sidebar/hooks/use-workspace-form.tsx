"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import type { WorkspaceFormData } from "../types/workspace"

const workspaceSchema = z.object({
  name: z.string().min(1, "Workplace name is required").max(255, "Name must be less than 255 characters"),
  address: z.string().min(1, "Address is required").max(500, "Address must be less than 500 characters"),
  phone: z.string().max(20, "Phone number must be less than 20 characters").optional().or(z.literal("")),
})

export interface UseWorkspaceFormOptions {
  mode?: "create" | "edit"
  workspaceId?: number
  onSuccess?: (workspace: any) => void
  isOpen?: boolean
}

/**
 * Custom hook for workspace form management (create/edit)
 * Handles form state, validation, and API calls
 */
export function useWorkspaceForm({
  mode = "create",
  workspaceId,
  onSuccess,
  isOpen = false,
}: UseWorkspaceFormOptions) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    },
  })

  // Fetch workspace data when in edit mode and dialog opens
  useEffect(() => {
    if (mode === "edit" && workspaceId && isOpen) {
      const fetchWorkspace = async () => {
        try {
          setIsLoading(true)
          setError(null)
          const res = await fetchWithAuth(`${getApiBase()}/restaurants/${workspaceId}`)

          if (!res.ok) {
            throw new Error(`Failed to fetch restaurant (${res.status})`)
          }

          const response = await res.json()
          const workspace = response.data || response

          reset({
            name: workspace.name || "",
            address: workspace.address || "",
            phone: workspace.phone || "",
          })
        } catch (err: any) {
          console.error("Error fetching workspace:", err)
          setError(err?.message || "Failed to load workspace details")
        } finally {
          setIsLoading(false)
        }
      }

      fetchWorkspace()
    }
  }, [mode, workspaceId, isOpen, reset])

  const onSubmit = async (data: WorkspaceFormData) => {
    setError(null)

    try {
      if (mode === "edit" && !workspaceId) {
        throw new Error("Workspace ID is required for updating")
      }

      const payload: any = {
        name: data.name,
        address: data.address,
      }

      if (data.phone && data.phone.trim() !== "") {
        payload.phone = data.phone
      }

      const isEdit = mode === "edit"
      const endpoint = isEdit ? `${getApiBase()}/restaurants/${workspaceId}` : `${getApiBase()}/restaurants`
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetchWithAuth(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let message = `Failed to ${isEdit ? "update" : "create"} workspace`
        try {
          const text = await res.text()
          message = text.slice(0, 300)
        } catch {}
        throw new Error(`${message} (${res.status})`)
      }

      const workspace = await res.json()

      reset()

      if (onSuccess) {
        onSuccess(workspace)
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.")
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
  }
}
