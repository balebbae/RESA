"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { FieldLabel } from "@/components/ui/field"

interface WorkspaceDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

/**
 * Delete confirmation dialog with safety confirmation text input
 * Extracted from create-workspace-form for better separation
 */
export function WorkspaceDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: WorkspaceDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("")

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setConfirmText("")
    }
  }

  const handleConfirm = async () => {
    await onConfirm()
    setConfirmText("")
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this workplace and all associated data including employees, roles, schedules, and shifts. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <FieldLabel htmlFor="delete-confirm">
            Type <span className="font-semibold">&quot;GOODBYE FOREVER&quot;</span> to confirm
          </FieldLabel>
          <Input
            id="delete-confirm"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="GOODBYE FOREVER"
            className="mt-2"
            disabled={isDeleting}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || confirmText !== "GOODBYE FOREVER"}
            className="bg-destructive text-destructive-foreground text-white hover:bg-destructive/80"
          >
            {isDeleting ? "Deleting..." : "Delete Workplace"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
