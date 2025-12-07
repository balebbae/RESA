"use client"

import { useState, useEffect, useCallback } from "react"
import { Edit2, Mail, Calendar, Briefcase, X, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEmployeeForm } from "@/hooks/use-employee-form"
import { useEmployeeDelete } from "@/hooks/use-employee-delete"
import { EmployeeDeleteDialog } from "./employee-delete-dialog"
import { RoleFormDialog } from "@/components/roles/role-form-dialog"
import type { Employee } from "@/types/employee"
import type { Role } from "@/types/role"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-helpers"

interface EmployeeDetailSheetProps {
  employee: Employee | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: number | null
  onSuccess?: () => void
  onRoleCreated?: () => void | Promise<void>
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
  onRoleCreated,
}: EmployeeDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Role state management
  const [employeeRoles, setEmployeeRoles] = useState<Role[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [isAssigningRoles, setIsAssigningRoles] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [selectValue, setSelectValue] = useState<string>("")

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false)
    }
  }, [isOpen])

  const {
    register,
    handleSubmit,
    onSubmit: originalOnSubmit,
    errors,
    isSubmitting,
    isLoading,
    error,
    reset,
  } = useEmployeeForm({
    mode: "edit",
    restaurantId,
    employeeId: employee?.id,
    onSuccess: async (updatedEmployee: unknown) => {
      // Extract employee ID from either the updated employee or the existing employee
      const emp = updatedEmployee as Record<string, unknown> | null
      const empData = emp && typeof emp === 'object' && 'data' in emp ? emp.data as Record<string, unknown> : null
      const employeeId = (emp && 'id' in emp ? emp.id as number : null) || (empData && 'id' in empData ? empData.id as number : null) || employee?.id

      // Handle role updates
      if (restaurantId && employeeId) {
        try {
          setIsAssigningRoles(true)

          // Calculate role differences
          const rolesToAdd = selectedRoles.filter(
            sr => !employeeRoles.some(er => er.id === sr.id)
          )
          const rolesToRemove = employeeRoles.filter(
            er => !selectedRoles.some(sr => sr.id === er.id)
          )

          // Step 1: Remove roles (DELETE)
          if (rolesToRemove.length > 0) {
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

          // Step 2: Add new roles (POST)
          if (rolesToAdd.length > 0) {
            const roleIds = rolesToAdd.map(role => role.id)

            const addRes = await fetchWithAuth(
              `${getApiBase()}/restaurants/${restaurantId}/employees/${employeeId}/roles`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role_ids: roleIds }),
              }
            )

            if (!addRes.ok) {
              const errorText = await addRes.text()
              throw new Error("Failed to add roles")
            }
          }

          // Update local state with new roles
          setEmployeeRoles(selectedRoles)

        } catch (err) {
          const msg = err instanceof Error ? err.message : "Failed to update roles"
          setRolesError(msg)
          showErrorToast(msg)
          setIsAssigningRoles(false)
          return // Don't exit edit mode if role assignment fails
        } finally {
          setIsAssigningRoles(false)
        }
      }

      setIsEditing(false)
      showSuccessToast("Employee updated successfully")
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
      showSuccessToast("Employee deleted successfully")
      if (onSuccess) {
        onSuccess()
      }
    },
  })

  // Fetch employee roles and available roles
  const fetchRoles = useCallback(async () => {
    if (!restaurantId || !employee?.id) return

    try {
      setRolesLoading(true)
      setRolesError(null)

      // Fetch all available roles for the restaurant
      const rolesRes = await fetchWithAuth(`${getApiBase()}/restaurants/${restaurantId}/roles`)
      if (!rolesRes.ok) {
        throw new Error(`Failed to fetch roles (${rolesRes.status})`)
      }
      const rolesResponse = await rolesRes.json()
      const roles = Array.isArray(rolesResponse) ? rolesResponse : (rolesResponse.data || [])
      setAvailableRoles(roles)

      // Fetch employee-specific roles
      const employeeRolesRes = await fetchWithAuth(`${getApiBase()}/restaurants/${restaurantId}/employees/${employee.id}/roles`)
      if (!employeeRolesRes.ok) {
        throw new Error(`Failed to fetch employee roles (${employeeRolesRes.status})`)
      }
      const employeeRolesResponse = await employeeRolesRes.json()
      const empRoles = Array.isArray(employeeRolesResponse) ? employeeRolesResponse : (employeeRolesResponse.data || [])
      setEmployeeRoles(empRoles)

    } catch (err) {
      console.error("Error fetching roles:", err)
      setRolesError(err instanceof Error ? err.message : "Failed to load roles")
      setAvailableRoles([])
      setEmployeeRoles([])
    } finally {
      setRolesLoading(false)
    }
  }, [restaurantId, employee?.id])

  // Fetch employee roles and available roles when dialog opens
  useEffect(() => {
    if (!isOpen || !restaurantId || !employee?.id) return
    fetchRoles()
  }, [isOpen, restaurantId, employee?.id, fetchRoles])

  // Initialize selected roles when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setSelectedRoles([...employeeRoles])
    } else {
      // Reset selected roles when exiting edit mode
      setSelectedRoles([])
    }
  }, [isEditing])

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

  const handleFormSubmit = handleSubmit(originalOnSubmit)

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

    // Extract role from either direct or wrapped response
    const role = (newRole && typeof newRole === 'object' && 'data' in newRole)
      ? (newRole as Record<string, unknown>).data
      : newRole

    // Automatically select the newly created role
    if (role && typeof role === 'object' && 'id' in role) {
      const roleObj = role as Role
      setSelectedRoles(prev => {
        // Only add if not already selected
        if (prev.some(r => r.id === roleObj.id)) {
          return prev
        }
        return [...prev, roleObj]
      })
    }

    showSuccessToast("Role created successfully")

    // Trigger parent callback to refresh sidebar role list
    if (onRoleCreated) {
      await onRoleCreated()
    }

    setShowRoleDialog(false)
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

          <form onSubmit={handleFormSubmit} className="space-y-6">
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
                  className="h-8 w-8 -mt-1 hover:cursor-pointer"
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

            {/* Roles Section */}
            <div className="space-y-2">
              {!isEditing ? (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">Roles</p>
                    {rolesLoading ? (
                      <p className="text-sm text-muted-foreground">Loading roles...</p>
                    ) : employeeRoles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {employeeRoles.map((role) => (
                          <Badge key={role.id} variant="secondary">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No roles assigned</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <label htmlFor="role" className="text-sm font-medium">
                    Roles (Optional)
                  </label>
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
                      {availableRoles.map((role) => (
                        <SelectItem
                          key={role.id}
                          value={role.id.toString()}
                          disabled={selectedRoles.some(r => r.id === role.id)}
                        >
                          {role.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="create-new" className="text-primary font-medium">
                        <Plus className="h-4 w-4 inline mr-2" />
                        Create new role
                      </SelectItem>
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
                  disabled={isDeleting || isSubmitting || isAssigningRoles}
                >
                  Delete
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelClick}
                    disabled={isSubmitting || isAssigningRoles}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoading || isAssigningRoles}
                  >
                    {isAssigningRoles ? "Assigning roles..." : isSubmitting ? "Saving..." : "Save"}
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
