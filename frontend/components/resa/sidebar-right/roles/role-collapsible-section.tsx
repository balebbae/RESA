"use client"

import * as React from "react"
import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { ChevronRight, Briefcase } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/resa/sidebar-core/sidebar"
import { useRoles } from "./hooks/use-roles"
import { RoleDetailSheet } from "./role-detail-sheet"
import type { Role } from "@/components/resa/sidebar-right/types/role"

interface RoleCollapsibleSectionProps {
  restaurantId: number | null
}

export interface RoleCollapsibleSectionRef {
  refetch: () => void
}

/**
 * Collapsible section for roles
 * Displays roles in a collapsible sidebar section with view/edit functionality
 * Similar to employee collapsible section but for roles
 */
export const RoleCollapsibleSection = forwardRef<
  RoleCollapsibleSectionRef,
  RoleCollapsibleSectionProps
>(function RoleCollapsibleSection({
  restaurantId,
}, ref) {
  const { roles, refetch } = useRoles(restaurantId)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Expose refetch method to parent component
  useImperativeHandle(ref, () => ({
    refetch,
  }))

  // Update selected role when roles list changes
  useEffect(() => {
    if (selectedRole && roles.length > 0) {
      const updatedRole = roles.find(r => r.id === selectedRole.id)
      if (updatedRole) {
        setSelectedRole(updatedRole)
      }
    }
  }, [roles, selectedRole?.id])

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role)
    setIsSheetOpen(true)
  }

  const handleRoleUpdate = () => {
    refetch()
  }

  // Show message when no restaurant is selected
  if (!restaurantId) {
    return (
      <>
        <SidebarGroup className="py-0">
          <SidebarGroupLabel className="text-sidebar-foreground text-sm">
            Roles
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Select a workplace to view roles
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="mx-0" />
      </>
    )
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
      {/* Roles Section */}
      <SidebarGroup className="py-0">
        <Collapsible defaultOpen={false} className="group/collapsible">
          <SidebarGroupLabel
            asChild
            className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm hover:cursor-pointer"
          >
            <CollapsibleTrigger>
              Roles{" "}
              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {roles.length === 0 ? (
                  <div className="px-2 py-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No roles configured yet
                    </p>
                  </div>
                ) : (
                  roles.map((role) => (
                    <SidebarMenuItem key={role.id}>
                      <SidebarMenuButton
                        onClick={() => handleRoleClick(role)}
                        className="h-auto min-h-14 py-2 hover:cursor-pointer"
                      >
                        <Briefcase className="h-4 w-4" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm">{role.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Created {formatDate(role.created_at)}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
      <SidebarSeparator className="mx-0" />

      {/* Role Detail Sheet */}
      <RoleDetailSheet
        role={selectedRole}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        restaurantId={restaurantId}
        onSuccess={handleRoleUpdate}
      />
    </>
  )
})
