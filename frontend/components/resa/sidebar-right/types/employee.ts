/**
 * Employee type definitions
 */

export interface Role {
  id: number
  restaurant_id: number
  name: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: number
  restaurant_id: number
  full_name: string
  email: string
  created_at: string
  updated_at: string
}

export interface EmployeeFormData {
  full_name: string
  email: string
}

export interface UseEmployeesReturn {
  employees: Employee[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseEmployeeFormReturn {
  isSubmitting: boolean
  error: string | null
  onSubmit: (data: EmployeeFormData) => Promise<void>
  reset: () => void
}

export interface UseEmployeeDeleteReturn {
  isDeleting: boolean
  error: string | null
  deleteEmployee: (id: number) => Promise<void>
}
