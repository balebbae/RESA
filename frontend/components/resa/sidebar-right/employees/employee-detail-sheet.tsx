"use client"

import { useState, useEffect } from "react"
import { Edit2, Mail, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEmployeeForm } from "./hooks/use-employee-form"
import { useEmployeeDelete } from "./hooks/use-employee-delete"
import { EmployeeDeleteDialog } from "./employee-delete-dialog"
import type { Employee } from "@/components/resa/sidebar-right/types/employee"

interface EmployeeDetailSheetProps {
  employee: Employee | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: number | null
  onSuccess?: () => void
}

/**
 * Modal dialog that displays employee details with inline editing
 * Clicking edit button toggles inline edit mode with seamless in-place field replacement
 */
export function EmployeeDetailSheet({
  employee,
  isOpen,
  onOpenChange,
  restaurantId,
  onSuccess,
}: EmployeeDetailSheetProps) {
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
  } = useEmployeeForm({
    mode: "edit",
    restaurantId,
    employeeId: employee?.id,
    onSuccess: (updatedEmployee) => {
      setIsEditing(false)
      if (onSuccess) {
        onSuccess()
      }
    },
    isOpen: isOpen && isEditing,
  })

  const { isDeleting, deleteEmployee } = useEmployeeDelete({
    restaurantId,
    onSuccess: () => {
      setShowDeleteConfirm(false)
      onOpenChange(false)
      setIsEditing(false)
      if (onSuccess) {
        onSuccess()
      }
    },
  })

  if (!employee) return null

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
    if (!employee.id) return
    try {
      await deleteEmployee(employee.id)
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
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error message (edit mode only) */}
            {error && isEditing && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Employee Name Section */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {!isEditing ? (
                  <h2 className="text-2xl font-semibold">{employee.full_name}</h2>
                ) : (
                  <div className="space-y-1">
                    <label htmlFor="full_name" className="text-sm font-medium">
                      Full Name
                    </label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="John Doe"
                      {...register("full_name")}
                    />
                    {errors.full_name && (
                      <p className="text-sm text-red-600">{errors.full_name.message}</p>
                    )}
                  </div>
                )}
              </div>

              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEditClick}
                  className="h-8 w-8 -mt-1"
                  type="button"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit employee</span>
                </Button>
              )}
            </div>

            {/* Email Section */}
            <div className="space-y-1">
              {!isEditing ? (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                  </div>
                </div>
              ) : (
                <>
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </>
              )}
            </div>

            {/* Added Date Section (always read-only) */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Added</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(employee.created_at)}
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
      <EmployeeDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        employeeName={employee.full_name}
      />
    </>
  )
}
