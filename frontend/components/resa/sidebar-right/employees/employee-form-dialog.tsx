"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useEmployeeForm } from "./hooks/use-employee-form"
import { useEmployeeDelete } from "./hooks/use-employee-delete"
import { EmployeeDeleteDialog } from "./employee-delete-dialog"

interface EmployeeFormDialogProps {
  mode?: "create" | "edit"
  restaurantId: number | null
  employeeId?: number
  employeeName?: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (employee: unknown) => void
}

/**
 * Employee form dialog for creating and editing employees
 * Similar to workspace-form-dialog but simpler (only name and email fields)
 */
export function EmployeeFormDialog({
  mode = "create",
  restaurantId,
  employeeId,
  employeeName,
  isOpen: externalOpen,
  onOpenChange,
  onSuccess,
}: EmployeeFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const dialogOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setDialogOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  const handleSuccess = (employee: unknown) => {
    setDialogOpen(false)
    if (onSuccess) {
      onSuccess(employee)
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
  } = useEmployeeForm({
    mode,
    restaurantId,
    employeeId,
    onSuccess: handleSuccess,
    isOpen: dialogOpen,
  })

  const { isDeleting, deleteEmployee } = useEmployeeDelete({
    restaurantId,
    onSuccess: () => {
      setShowDeleteConfirm(false)
      setDialogOpen(false)
      reset()
      if (onSuccess) {
        onSuccess(null)
      }
    },
  })

  const handleDelete = async () => {
    if (!employeeId) return
    try {
      await deleteEmployee(employeeId)
    } catch {
      // Error is already set by the hook
      setShowDeleteConfirm(false)
    }
  }

  const isEditMode = mode === "edit"
  const dialogTitle = isEditMode ? "Edit Employee" : "Add New Employee"
  const dialogDescription = isEditMode
    ? "Update employee information."
    : "Add a new employee to this workplace."
  const submitButtonText = isSubmitting
    ? (isEditMode ? "Updating..." : "Adding...")
    : (isEditMode ? "Update Employee" : "Add Employee")

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {!isEditMode && externalOpen === undefined && (
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        )}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {(error || isLoading) && (
              <p className="text-sm text-red-600">{error || "Loading employee details..."}</p>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  {...register("full_name")}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </Field>
            </FieldGroup>

            <div className="flex justify-between gap-3">
              {isEditMode ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting || isLoading}>
                  {submitButtonText}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <EmployeeDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        employeeName={employeeName}
      />
    </>
  )
}
