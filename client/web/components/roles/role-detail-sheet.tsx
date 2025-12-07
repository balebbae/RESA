"use client"

import { useState, useEffect } from "react"
import { Edit2, Calendar, Briefcase } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRoleForm } from "@/hooks/use-role-form"
import { useRoleDelete } from "@/hooks/use-role-delete"
import { RoleDeleteDialog } from "./role-delete-dialog"
import type { Role } from "@/types/role"
import { showSuccessToast } from "@/lib/utils/toast-helpers"

interface RoleDetailSheetProps {
  role: Role | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: number | null
  onSuccess?: () => void
}

/**
 * Modal dialog that displays role details with inline editing
 * Clicking edit button toggles inline edit mode with seamless in-place field replacement
 * Similar to EmployeeDetailSheet but simpler (only name field)
 */
export function RoleDetailSheet({
  role,
  isOpen,
  onOpenChange,
  restaurantId,
  onSuccess,
}: RoleDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false)
    }
  }, [isOpen])

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
    mode: "edit",
    restaurantId,
    roleId: role?.id,
    onSuccess: (updatedRole) => {
      setIsEditing(false)
      showSuccessToast("Role updated successfully")
      if (onSuccess) {
        onSuccess()
      }
    },
    isOpen: isOpen && isEditing,
  })

  const { isDeleting, deleteRole } = useRoleDelete({
    restaurantId,
    onSuccess: () => {
      setShowDeleteConfirm(false)
      onOpenChange(false)
      setIsEditing(false)
      showSuccessToast("Role deleted successfully")
      if (onSuccess) {
        onSuccess()
      }
    },
  })

  if (!role) return null

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelClick = () => {
    setIsEditing(false)
    reset()
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!role.id) return
    try {
      await deleteRole(role.id)
    } catch {
      // Error is already set by the hook
      setShowDeleteConfirm(false)
    }
  }

  // Format dates for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Role Details</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error message (edit mode only) */}
            {error && isEditing && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Role Name Section */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {!isEditing ? (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-6 w-6 text-muted-foreground" />
                    <h2 className="text-2xl font-semibold">{role.name}</h2>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label htmlFor="name" className="text-sm font-medium">
                      Role Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Manager"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                )}
              </div>

              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEditClick}
                  className="h-8 w-8 -mt-1 hover:cursor-pointer"
                  type="button"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit role</span>
                </Button>
              )}
            </div>

            {/* Created Date Section (always read-only) */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(role.created_at)}
                </p>
              </div>
            </div>

            {/* Action Buttons (edit mode only) */}
            {isEditing && (
              <div className="flex justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={isDeleting || isSubmitting}
                >
                  Delete
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelClick}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <RoleDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        roleName={role.name}
        roleId={role.id}
        restaurantId={restaurantId ?? undefined}
      />
    </>
  )
}
