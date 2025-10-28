"use client"

import { useState } from "react"
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
import { useRoleForm } from "./hooks/use-role-form"
import { useRoleDelete } from "./hooks/use-role-delete"
import { RoleDeleteDialog } from "./role-delete-dialog"

interface RoleFormDialogProps {
  mode?: "create" | "edit"
  restaurantId: number | null
  roleId?: number
  roleName?: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (role: unknown) => void
}

/**
 * Role form dialog for creating and editing roles
 * Simpler than employee form (single field)
 */
export function RoleFormDialog({
  mode = "create",
  restaurantId,
  roleId,
  roleName,
  isOpen: externalOpen,
  onOpenChange,
  onSuccess,
}: RoleFormDialogProps) {
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

  const handleSuccess = (role: unknown) => {
    setDialogOpen(false)
    if (onSuccess) {
      onSuccess(role)
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
  } = useRoleForm({
    mode,
    restaurantId,
    roleId,
    onSuccess: handleSuccess,
    isOpen: dialogOpen,
  })

  const { isDeleting, deleteRole } = useRoleDelete({
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
    if (!roleId) return
    try {
      await deleteRole(roleId)
    } catch {
      // Error is already set by the hook
      setShowDeleteConfirm(false)
    }
  }

  const isEditMode = mode === "edit"
  const dialogTitle = isEditMode ? "Edit Role" : "Add New Role"
  const dialogDescription = isEditMode
    ? "Update role information."
    : "Add a new role to this workplace."
  const submitButtonText = isSubmitting
    ? (isEditMode ? "Updating..." : "Adding...")
    : (isEditMode ? "Update Role" : "Add Role")

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {(error || isLoading) && (
              <p className="text-sm text-red-600">{error || "Loading role details..."}</p>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Role Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Manager"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
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
      <RoleDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        roleName={roleName}
      />
    </>
  )
}
