/**
 * Workspace (Restaurant) type definitions
 */

export interface Workspace {
  id: number
  name: string
  address?: string
  phone?: string
  emoji?: string
  pages?: WorkspacePage[]
  createdAt?: string
  updatedAt?: string
}

export interface WorkspacePage {
  name: string
  url?: string
}

export interface WorkspaceFormData {
  name: string
  address: string
  phone?: string
}

export interface UseWorkspacesReturn {
  workplaces: Workspace[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseWorkspaceFormReturn {
  isSubmitting: boolean
  error: string | null
  onSubmit: (data: WorkspaceFormData) => Promise<void>
  reset: () => void
}

export interface UseWorkspaceDeleteReturn {
  isDeleting: boolean
  error: string | null
  deleteWorkspace: (id: number) => Promise<void>
}
