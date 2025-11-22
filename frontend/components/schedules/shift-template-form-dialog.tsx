"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useShiftTemplateForm } from "@/hooks/use-shift-template-form"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import type { Role } from "@/types/role"

interface ShiftTemplateFormDialogProps {
  mode?: "create" | "edit"
  restaurantId: number | null
  shiftTemplateId?: number
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (shiftTemplate: unknown) => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

/**
 * Shift template form dialog for creating and editing shift templates
 */
export function ShiftTemplateFormDialog({
  mode = "create",
  restaurantId,
  shiftTemplateId,
  isOpen: externalOpen,
  onOpenChange,
  onSuccess,
}: ShiftTemplateFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)

  const dialogOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setDialogOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  const handleSuccess = (shiftTemplate: unknown) => {
    setDialogOpen(false)
    if (onSuccess) {
      onSuccess(shiftTemplate)
    }
  }

  const {
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
  } = useShiftTemplateForm({
    mode,
    restaurantId,
    shiftTemplateId,
    onSuccess: handleSuccess,
    isOpen: dialogOpen,
  })

  // Fetch available roles
  const fetchRoles = useCallback(async () => {
    if (!restaurantId) return

    try {
      setRolesLoading(true)
      setRolesError(null)
      const res = await fetchWithAuth(`${getApiBase()}/restaurants/${restaurantId}/roles`)

      if (!res.ok) {
        throw new Error(`Failed to fetch roles (${res.status})`)
      }

      const response = await res.json()
      const roles = Array.isArray(response) ? response : (response.data || [])
      setAvailableRoles(roles)
    } catch (err) {
      console.error("Error fetching roles:", err)
      setRolesError(err instanceof Error ? err.message : "Failed to load roles")
      setAvailableRoles([])
    } finally {
      setRolesLoading(false)
    }
  }, [restaurantId])

  // Fetch available roles when dialog opens
  useEffect(() => {
    if (!dialogOpen || !restaurantId) return
    fetchRoles()
  }, [dialogOpen, restaurantId, fetchRoles])

  const isEditMode = mode === "edit"
  const dialogTitle = isEditMode ? "Edit Shift Template" : "Add New Shift Template"
  const dialogDescription = isEditMode
    ? "Update shift template information."
    : "Add a new shift template to this workplace."
  const submitButtonText = isSubmitting
    ? (isEditMode ? "Updating..." : "Adding...")
    : (isEditMode ? "Update Shift Template" : "Add Shift Template")

  const selectedRoleIds = watch("role_ids")
  const selectedDayOfWeek = watch("day_of_week")
  const templateName = watch("name")

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(error || isLoading) && (
            <p className="text-sm text-red-600">{error || "Loading shift template details..."}</p>
          )}

          <FieldGroup>
            {/* Name Field (Optional) */}
            <Field>
              <FieldLabel htmlFor="name">Name (Optional)</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Morning Shift, Closing Shift"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </Field>

            {/* Role Selection (Multiple) */}
            <Field>
              <FieldLabel>Roles (Select at least one)</FieldLabel>
              {rolesLoading ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  Loading roles...
                </div>
              ) : availableRoles.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No roles available
                </div>
              ) : (
                <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                  {availableRoles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-sidebar-accent p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        value={role.id}
                        checked={selectedRoleIds?.includes(role.id) || false}
                        onChange={(e) => {
                          const roleId = parseInt(e.target.value)
                          const currentRoles = selectedRoleIds || []
                          if (e.target.checked) {
                            setValue("role_ids", [...currentRoles, roleId])
                          } else {
                            setValue("role_ids", currentRoles.filter(id => id !== roleId))
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{role.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {rolesError && (
                <p className="text-sm text-red-600">{rolesError}</p>
              )}
              {errors.role_ids && (
                <p className="text-sm text-red-600">{errors.role_ids.message}</p>
              )}
            </Field>

            {/* Day of Week Selection */}
            <Field>
              <FieldLabel htmlFor="day_of_week">Day of Week</FieldLabel>
              <Select
                value={selectedDayOfWeek !== undefined ? selectedDayOfWeek.toString() : "0"}
                onValueChange={(value) => setValue("day_of_week", parseInt(value))}
              >
                <SelectTrigger id="day_of_week" className="w-full">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem
                      key={day.value}
                      value={day.value.toString()}
                    >
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.day_of_week && (
                <p className="text-sm text-red-600">{errors.day_of_week.message}</p>
              )}
            </Field>

            {/* Start Time */}
            <Field>
              <FieldLabel htmlFor="start_time">Start Time</FieldLabel>
              <Input
                id="start_time"
                type="time"
                {...register("start_time")}
              />
              {errors.start_time && (
                <p className="text-sm text-red-600">{errors.start_time.message}</p>
              )}
            </Field>

            {/* End Time */}
            <Field>
              <FieldLabel htmlFor="end_time">End Time</FieldLabel>
              <Input
                id="end_time"
                type="time"
                {...register("end_time")}
              />
              {errors.end_time && (
                <p className="text-sm text-red-600">{errors.end_time.message}</p>
              )}
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {submitButtonText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
