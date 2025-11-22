"use client"

import * as React from "react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/resa/sidebar-core/sidebar"
import { useShiftTemplateContext } from "@/contexts/shift-template-context"
import { getRoleColor } from "@/components/resa/schedule/utils/role-colors"

/**
 * Role legend component - shows color key for shift template roles
 * Displays in the left sidebar to help users identify which colors
 * correspond to which roles on the calendar
 */
export function RoleLegend() {
  const { roles, roleColorMap } = useShiftTemplateContext()

  // Don't show legend if no roles
  if (roles.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Role Legend</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {roles.map((role) => {
            const roleColor = getRoleColor(role.id, roleColorMap)

            return (
              <SidebarMenuItem key={role.id}>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <div
                    className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: roleColor }}
                  />
                  <span className="text-sm truncate">{role.name}</span>
                </div>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
