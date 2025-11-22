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
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useWorkspaceForm } from "@/hooks/use-workspace-form"
import { useWorkspaceDelete } from "@/hooks/use-workspace-delete"
import { WorkspaceDeleteDialog } from "./workspace-delete-dialog"
import { PlacesAutocompleteInput } from "./places-autocomplete-input"

interface WorkspaceFormDialogProps {
  mode?: "create" | "edit"
  workspaceId?: number
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (workspace: any) => void
}

/**
 * Workspace form dialog for creating and editing workplaces
 * Simplified by extracting form logic to hooks
 */
export function WorkspaceFormDialog({
  mode = "create",
  workspaceId,
  isOpen: externalOpen,
  onOpenChange,
  onSuccess,
}: WorkspaceFormDialogProps) {
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

  const handleSuccess = (workspace: any) => {
    setDialogOpen(false)
    if (onSuccess) {
      onSuccess(workspace)
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
    trigger,
  } = useWorkspaceForm({
    mode,
    workspaceId,
    onSuccess: handleSuccess,
    isOpen: dialogOpen,
  })

  const { isDeleting, deleteWorkspace, setError: setDeleteError } = useWorkspaceDelete({
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
    if (!workspaceId) return
    try {
      await deleteWorkspace(workspaceId)
    } catch (err) {
      // Error is already set by the hook
      setShowDeleteConfirm(false)
    }
  }

  const isEditMode = mode === "edit"
  const dialogTitle = isEditMode ? "Edit Workplace" : "Create New Workplace"
  const dialogDescription = isEditMode
    ? "Update workplace information."
    : "Add a new workplace to manage schedules and employees."
  const submitButtonText = isSubmitting
    ? (isEditMode ? "Updating..." : "Creating...")
    : (isEditMode ? "Update Workplace" : "Create Workplace")

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {!isEditMode && (
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:cursor-pointer"
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
              <p className="text-sm text-red-600">{error || "Loading workplace details..."}</p>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Workplace Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Joe's Pizza"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel>Address</FieldLabel>
                <PlacesAutocompleteInput
                  value={watch("address") || ""}
                  onChange={(address, details) => {
                    setValue("address", address, { shouldValidate: true })
                    // Log place details for future use (lat/lng, structured address)
                    if (details && process.env.NODE_ENV === "development") {
                      console.log("Place details:", details)
                    }
                  }}
                  onBlur={() => trigger("address")}
                  placeholder="Start typing to search for an address..."
                  disabled={isSubmitting || isLoading}
                  error={errors.address?.message}
                />
                {errors.address ? (
                  <p className="text-sm text-red-600">{errors.address.message}</p>
                ) : (
                  <FieldDescription>
                    Start typing to search for an address
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1-555-123-4567 (optional)"
                  {...register("phone")}
                />
                {errors.phone ? (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                ) : (
                  <FieldDescription>
                    Optional contact number for the workplace
                  </FieldDescription>
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
      <WorkspaceDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  )
}
