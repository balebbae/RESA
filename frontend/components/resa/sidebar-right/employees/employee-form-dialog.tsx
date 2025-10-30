"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, X } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useEmployeeForm } from "./hooks/use-employee-form"
import { useEmployeeDelete } from "./hooks/use-employee-delete"
import { EmployeeDeleteDialog } from "./employee-delete-dialog"
import { RoleFormDialog } from "../roles/role-form-dialog"
import type { Role } from "../types/employee"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"

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
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([])
  const [initialRoles, setInitialRoles] = useState<Role[]>([]) // Track original roles for diff
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [isAssigningRoles, setIsAssigningRoles] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [selectValue, setSelectValue] = useState<string>("")

  const dialogOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setDialogOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  const handleRoleUpdates = async (empId: number) => {
    if (!restaurantId) {
      return false
    }

    if (mode === "edit") {
      // Calculate differences between initial and selected roles
      const rolesToAdd = selectedRoles.filter(
        sr => !initialRoles.some(ir => ir.id === sr.id)
      )
      const rolesToRemove = initialRoles.filter(
        ir => !selectedRoles.some(sr => sr.id === ir.id)
      )

      // Skip if no changes
      if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
        return true
      }

      // Remove roles first (DELETE for each removed role)
      for (const role of rolesToRemove) {
        const res = await fetchWithAuth(
          `${getApiBase()}/restaurants/${restaurantId}/employees/${empId}/roles/${role.id}`,
          { method: "DELETE" }
        )

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Failed to remove role ${role.name}`)
        }
      }

      // Then add new roles (if any)
      if (rolesToAdd.length > 0) {
        const res = await fetchWithAuth(
          `${getApiBase()}/restaurants/${restaurantId}/employees/${empId}/roles`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role_ids: rolesToAdd.map(r => r.id) })
          }
        )

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error("Failed to add roles")
        }
      }
    } else {
      // In create mode, just assign the selected roles
      if (selectedRoles.length > 0) {
        const roleIds = selectedRoles.map(role => role.id)

        const res = await fetchWithAuth(
          `${getApiBase()}/restaurants/${restaurantId}/employees/${empId}/roles`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role_ids: roleIds }),
          }
        )

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Failed to assign roles (${res.status}): ${errorText}`)
        }
      }
    }

    return true
  }

  const handleSuccess = async (employee: any) => {
    // Extract employee ID from either employee.id or employee.data.id
    const currentEmployeeId = employee?.id || employee?.data?.id

    // Handle role updates
    if (restaurantId && currentEmployeeId) {
      try {
        setIsAssigningRoles(true)
        await handleRoleUpdates(currentEmployeeId)
      } catch (err) {
        setRolesError(err instanceof Error ? err.message : "Failed to update roles")
        setIsAssigningRoles(false)
        return // Don't close dialog if role update fails
      } finally {
        setIsAssigningRoles(false)
      }
    }

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

  // Custom save button handler that explicitly handles all updates
  const handleSaveButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault()

    try {
      // Get form values manually
      const formElement = e.currentTarget.closest('form')
      if (!formElement) {
        return
      }

      const formData = new FormData(formElement)
      const fullName = formData.get('full_name') as string
      const email = formData.get('email') as string

      // Validate
      if (!fullName || !email) {
        setError("Name and email are required")
        return
      }

      setError(null)
      setRolesError(null)

      if (mode === "edit" && employeeId && restaurantId) {
        // EDIT MODE: Update employee, then update roles

        // Step 1: Update employee data (PATCH)
        const updateRes = await fetchWithAuth(
          `${getApiBase()}/restaurants/${restaurantId}/employees/${employeeId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name: fullName, email })
          }
        )

        if (!updateRes.ok) {
          const errorText = await updateRes.text()
          throw new Error(`Failed to update employee (${updateRes.status})`)
        }

        // Step 2: Calculate role differences
        const rolesToAdd = selectedRoles.filter(
          sr => !initialRoles.some(ir => ir.id === sr.id)
        )
        const rolesToRemove = initialRoles.filter(
          ir => !selectedRoles.some(sr => sr.id === ir.id)
        )

        // Step 3: Remove roles (DELETE)
        if (rolesToRemove.length > 0) {
          setIsAssigningRoles(true)

          for (const role of rolesToRemove) {
            const deleteRes = await fetchWithAuth(
              `${getApiBase()}/restaurants/${restaurantId}/employees/${employeeId}/roles/${role.id}`,
              { method: "DELETE" }
            )

            if (!deleteRes.ok) {
              const errorText = await deleteRes.text()
              throw new Error(`Failed to remove role ${role.name}`)
            }
          }
        }

        // Step 4: Add roles (POST)
        if (rolesToAdd.length > 0) {
          setIsAssigningRoles(true)

          const addRes = await fetchWithAuth(
            `${getApiBase()}/restaurants/${restaurantId}/employees/${employeeId}/roles`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role_ids: rolesToAdd.map(r => r.id) })
            }
          )

          if (!addRes.ok) {
            const errorText = await addRes.text()
            throw new Error("Failed to add roles")
          }
        }

        setIsAssigningRoles(false)

        // Close dialog and trigger success callback
        setDialogOpen(false)
        if (onSuccess) {
          onSuccess({ id: employeeId })
        }

      } else if (mode === "create" && restaurantId) {
        // CREATE MODE: Create employee, then assign roles

        // Step 1: Create employee (POST)
        const createRes = await fetchWithAuth(
          `${getApiBase()}/restaurants/${restaurantId}/employees`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name: fullName, email })
          }
        )

        if (!createRes.ok) {
          const errorText = await createRes.text()
          throw new Error(`Failed to create employee (${createRes.status})`)
        }

        const employeeData = await createRes.json()
        const newEmployeeId = employeeData?.id || employeeData?.data?.id

        // Step 2: Assign roles (POST)
        if (selectedRoles.length > 0 && newEmployeeId) {
          setIsAssigningRoles(true)

          const assignRes = await fetchWithAuth(
            `${getApiBase()}/restaurants/${restaurantId}/employees/${newEmployeeId}/roles`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role_ids: selectedRoles.map(r => r.id) })
            }
          )

          if (!assignRes.ok) {
            const errorText = await assignRes.text()
            throw new Error("Failed to assign roles")
          }

          setIsAssigningRoles(false)
        }

        // Close dialog and trigger success callback
        setDialogOpen(false)
        if (onSuccess) {
          onSuccess(employeeData)
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save changes"
      setError(errorMessage)
      setRolesError(errorMessage)
      setIsAssigningRoles(false)
    }
  }

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
      console.log("Roles API response:", response)

      // Handle both direct array and wrapped response formats
      const roles = Array.isArray(response) ? response : (response.data || [])
      console.log("Parsed roles:", roles)

      setAvailableRoles(roles)
    } catch (err) {
      console.error("Error fetching roles:", err)
      setRolesError(err instanceof Error ? err.message : "Failed to load roles")
      setAvailableRoles([])
    } finally {
      setRolesLoading(false)
    }
  }, [restaurantId])

  // Fetch employee's current roles in edit mode
  const fetchEmployeeRoles = useCallback(async () => {
    if (!restaurantId || !employeeId || mode !== "edit") return

    try {
      setRolesLoading(true)
      setRolesError(null)
      const res = await fetchWithAuth(
        `${getApiBase()}/restaurants/${restaurantId}/employees/${employeeId}/roles`
      )

      if (!res.ok) {
        throw new Error(`Failed to fetch employee roles (${res.status})`)
      }

      const roles = await res.json()
      console.log("Employee's current roles:", roles)

      // Set both initial and selected roles to the employee's current roles
      setInitialRoles(roles)
      setSelectedRoles(roles)
    } catch (err) {
      console.error("Error fetching employee roles:", err)
      setRolesError(err instanceof Error ? err.message : "Failed to load employee roles")
      setInitialRoles([])
      setSelectedRoles([])
    } finally {
      setRolesLoading(false)
    }
  }, [restaurantId, employeeId, mode])

  // Fetch available roles when dialog opens
  useEffect(() => {
    if (!dialogOpen || !restaurantId) return
    fetchRoles()
  }, [dialogOpen, restaurantId, fetchRoles])

  // Fetch employee's current roles when dialog opens in edit mode
  useEffect(() => {
    if (!dialogOpen || !restaurantId || !employeeId || mode !== "edit") return
    fetchEmployeeRoles()
  }, [dialogOpen, restaurantId, employeeId, mode, fetchEmployeeRoles])

  // Reset roles when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setSelectedRoles([])
      setInitialRoles([])
    }
  }, [dialogOpen])

  const handleDelete = async () => {
    if (!employeeId) return
    try {
      await deleteEmployee(employeeId)
    } catch {
      // Error is already set by the hook
      setShowDeleteConfirm(false)
    }
  }

  const handleRoleSelect = (value: string) => {
    if (value === "create-new") {
      setShowRoleDialog(true)
      setSelectValue("") // Reset dropdown immediately
      return
    }

    const role = availableRoles.find(r => r.id === parseInt(value))
    if (role && !selectedRoles.find(r => r.id === role.id)) {
      setSelectedRoles([...selectedRoles, role])
      setSelectValue("") // Reset dropdown after adding role
    }
  }

  const handleRoleRemove = (roleId: number) => {
    setSelectedRoles(selectedRoles.filter(r => r.id !== roleId))
  }

  const handleRoleCreated = async (newRole: unknown) => {
    // Refetch roles to get the latest list from backend
    await fetchRoles()

    // Automatically select the newly created role
    if (newRole && typeof newRole === 'object' && 'id' in newRole) {
      const role = newRole as Role
      setSelectedRoles(prev => {
        // Only add if not already selected
        if (prev.some(r => r.id === role.id)) {
          return prev
        }
        return [...prev, role]
      })
    }

    setShowRoleDialog(false)
  }

  const isEditMode = mode === "edit"
  const dialogTitle = isEditMode ? "Edit Employee" : "Add New Employee"
  const dialogDescription = isEditMode
    ? "Update employee information."
    : "Add a new employee to this workplace."
  const submitButtonText = isAssigningRoles
    ? (isEditMode ? "Updating roles..." : "Assigning roles...")
    : isSubmitting
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
          <form className="space-y-4">
            {(error || isLoading) && (
              <p className="text-sm text-red-600">{error || "Loading employee details..."}</p>
            )}
            {isAssigningRoles && (
              <p className="text-sm text-blue-600">
                {isEditMode ? "Updating employee roles..." : "Assigning roles to employee..."}
              </p>
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

              <Field>
                <FieldLabel htmlFor="role">Role (Optional)</FieldLabel>
                <Select
                  value={selectValue}
                  onValueChange={(value) => {
                    setSelectValue(value)
                    handleRoleSelect(value)
                  }}
                  disabled={rolesLoading}
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select a role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.length === 0 && !rolesLoading && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No roles available
                      </div>
                    )}
                    {availableRoles.map((role) => (
                      <SelectItem
                        key={role.id}
                        value={role.id.toString()}
                        disabled={selectedRoles.some(r => r.id === role.id)}
                      >
                        {role.name}
                      </SelectItem>
                    ))}
                    {availableRoles.length > 0 && (
                      <SelectItem value="create-new" className="text-primary font-medium">
                        <Plus className="h-4 w-4 inline mr-2" />
                        Create new role
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {rolesError && (
                  <p className="text-sm text-red-600">{rolesError}</p>
                )}
                {selectedRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRoles.map((role) => (
                      <Badge key={role.id} variant="secondary" className="gap-1">
                        {role.name}
                        <button
                          type="button"
                          onClick={() => handleRoleRemove(role.id)}
                          className="ml-1 rounded-full hover:bg-muted"
                          aria-label={`Remove ${role.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
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
                <Button
                  type="button"
                  onClick={handleSaveButtonClick}
                  disabled={isSubmitting || isLoading || isAssigningRoles}
                >
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

      {/* Role Creation Dialog */}
      <RoleFormDialog
        mode="create"
        restaurantId={restaurantId}
        isOpen={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        onSuccess={handleRoleCreated}
      />
    </>
  )
}
