"use client"

import { createContext, useContext, useMemo } from "react"
import { useRestaurant } from "@/contexts/restaurant-context"
import { useShiftTemplates } from "@/hooks/use-shift-templates"
import { useRoles } from "@/hooks/use-roles"
import { generateRoleColors } from "@/lib/styles/role-colors"
import type { ShiftTemplate } from "@/types/shift-template"
import type { Role } from "@/types/role"

interface ShiftTemplateContextValue {
  shiftTemplates: ShiftTemplate[]
  roles: Role[]
  roleColorMap: Map<number, string>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const ShiftTemplateContext = createContext<ShiftTemplateContextValue | undefined>(undefined)

/**
 * Provider for shift template state shared between calendar and sidebar
 * Fetches shift templates and roles once, provides to all children
 */
export function ShiftTemplateProvider({ children }: { children: React.ReactNode }) {
  const { selectedRestaurantId } = useRestaurant()

  // Fetch shift templates and roles
  const {
    shiftTemplates,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates
  } = useShiftTemplates(selectedRestaurantId)

  const {
    roles,
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles
  } = useRoles(selectedRestaurantId)

  // Generate color map for roles
  const roleColorMap = useMemo(() => {
    return generateRoleColors(roles.map(role => role.id))
  }, [roles])

  // Combined refetch function
  const refetch = async () => {
    await Promise.all([refetchTemplates(), refetchRoles()])
  }

  const value: ShiftTemplateContextValue = {
    shiftTemplates,
    roles,
    roleColorMap,
    isLoading: templatesLoading || rolesLoading,
    error: templatesError || rolesError,
    refetch,
  }

  return (
    <ShiftTemplateContext.Provider value={value}>
      {children}
    </ShiftTemplateContext.Provider>
  )
}

/**
 * Hook to access shift template context
 * Must be used within ShiftTemplateProvider
 */
export function useShiftTemplateContext() {
  const context = useContext(ShiftTemplateContext)
  if (context === undefined) {
    throw new Error("useShiftTemplateContext must be used within ShiftTemplateProvider")
  }
  return context
}
