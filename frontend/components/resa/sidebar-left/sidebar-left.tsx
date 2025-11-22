"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/resa/sidebar-core/sidebar"
import { UserMenu } from "@/components/resa/sidebar-left/user/user-menu"
import { WorkspaceList } from "@/components/workspaces/workspace-list"
import { RoleLegend } from "@/components/roles/role-legend"
import { useWorkplaces } from "@/hooks/use-workplaces"

// TODO: Replace with actual user data from auth context
const TEMP_USER_DATA = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

/**
 * Left sidebar component - Simplified and refactored
 * - Extracted data fetching to useWorkplaces hook
 * - Extracted user menu to UserMenu component
 * - Extracted workspace list to WorkspaceList component
 */
export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { workplaces, refetch } = useWorkplaces()

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <UserMenu user={TEMP_USER_DATA} />
      </SidebarHeader>
      <SidebarContent>
        <WorkspaceList
          workplaces={workplaces}
          onWorkplaceChange={refetch}
        />
        <RoleLegend />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
