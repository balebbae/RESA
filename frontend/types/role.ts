/**
 * Role type definitions
 */

export interface Role {
  id: number
  restaurant_id: number
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface RoleFormData {
  name: string
  color: string
}

export interface UseRolesReturn {
  roles: Role[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseRoleFormReturn {
  isSubmitting: boolean
  error: string | null
  onSubmit: (data: RoleFormData) => Promise<void>
  reset: () => void
}

export interface UseRoleDeleteReturn {
  isDeleting: boolean
  error: string | null
  deleteRole: (id: number) => Promise<void>
}
