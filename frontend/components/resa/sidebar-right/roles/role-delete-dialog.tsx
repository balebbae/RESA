"use client"

import { useEffect, useState } from "react"
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
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import type { Employee } from "@/components/resa/sidebar-right/types/employee"

interface RoleDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isDeleting: boolean
  roleName?: string
  roleId?: number
  restaurantId?: number
}

/**
 * Delete confirmation dialog for roles
 * Checks if role has assigned employees before allowing deletion
 */
export function RoleDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  roleName,
  roleId,
  restaurantId,
}: RoleDeleteDialogProps) {
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch assigned employees when dialog opens
  useEffect(() => {
    if (open && roleId && restaurantId) {
      const fetchEmployees = async () => {
        setIsLoadingEmployees(true)
        setError(null)
        try {
          const res = await fetchWithAuth(
            `${getApiBase()}/restaurants/${restaurantId}/roles/${roleId}/employees`
          )

          if (!res.ok) {
            throw new Error("Failed to fetch employees")
          }

          const response = await res.json()
          // Handle both direct array and nested { data: [...] } response formats
          const employees = Array.isArray(response) ? response : (response?.data || [])
          setAssignedEmployees(Array.isArray(employees) ? employees : [])
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load employees")
          setAssignedEmployees([])
        } finally {
          setIsLoadingEmployees(false)
        }
      }

      fetchEmployees()
    } else {
      // Reset state when dialog closes
      setAssignedEmployees([])
      setError(null)
    }
  }, [open, roleId, restaurantId])

  const handleConfirm = async () => {
    await onConfirm()
  }

  const hasAssignedEmployees = assignedEmployees.length > 0
  const canDelete = !hasAssignedEmployees && !isLoadingEmployees && !error

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasAssignedEmployees ? "Cannot Delete Role" : "Are you sure?"}
          </AlertDialogTitle>
          {isLoadingEmployees ? (
            <AlertDialogDescription>
              <span className="text-muted-foreground">Checking for assigned employees...</span>
            </AlertDialogDescription>
          ) : error ? (
            <AlertDialogDescription>
              <span className="text-red-600">{error}</span>
            </AlertDialogDescription>
          ) : hasAssignedEmployees ? (
            <div className="text-muted-foreground text-sm space-y-2">
              <div>
                The <span className="font-semibold">{roleName}</span> role cannot be deleted because{" "}
                <span className="font-semibold">{assignedEmployees.length}</span>{" "}
                {assignedEmployees.length === 1 ? "employee is" : "employees are"} currently assigned to it.
              </div>
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Assigned employees:</div>
                <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                  {assignedEmployees.map((employee) => (
                    <li key={employee.id} className="text-muted-foreground">
                      • {employee.full_name} ({employee.email})
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 text-sm">
                Please reassign or remove these employees from this role before deleting it.
              </div>
            </div>
          ) : (
            <AlertDialogDescription>
              {roleName ? (
                <>
                  This will permanently delete the <span className="font-semibold">{roleName}</span> role from this workplace. This action cannot be undone.
                </>
              ) : (
                "This will permanently delete this role from this workplace. This action cannot be undone."
              )}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {hasAssignedEmployees ? "Close" : "Cancel"}
          </AlertDialogCancel>
          {!hasAssignedEmployees && (
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={!canDelete || isDeleting}
              className="bg-destructive text-destructive-foreground text-white hover:bg-destructive/80"
            >
              {isDeleting ? "Deleting..." : "Delete Role"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
