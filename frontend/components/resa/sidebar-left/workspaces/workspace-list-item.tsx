"use client"

import { Edit2 } from "lucide-react"
import {
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuItem,
} from "@/components/resa/sidebar-core/sidebar"
import { WorkspaceIcon } from "./workspace-icon"
import { useRestaurant } from "@/lib/restaurant-context"
import type { Workspace } from "@/components/resa/sidebar-left/types/workspace"

interface WorkspaceListItemProps {
  workspace: Workspace
  onEdit: (workspaceId: number) => void
}

/**
 * Individual workspace list item with edit action and selection support
 * Clicking selects the workspace and shows employees in right sidebar
 */
export function WorkspaceListItem({ workspace, onEdit }: WorkspaceListItemProps) {
  const { selectedRestaurantId, setSelectedRestaurant } = useRestaurant()
  const isSelected = selectedRestaurantId === workspace.id

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selection when clicking edit
    if (workspace.id) {
      onEdit(workspace.id)
    } else {
      console.error("Cannot edit workspace without valid ID:", workspace)
    }
  }

  const handleSelect = () => {
    if (workspace.id) {
      setSelectedRestaurant(workspace.id, workspace.name)
    }
  }

  return (
    <SidebarMenuItem key={workspace.name}>
      <SidebarMenuButton
        asChild
        className={isSelected ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
      >
        <button onClick={handleSelect} className="flex items-center gap-2 w-full hover:cursor-pointer">
          <WorkspaceIcon className="h-5 w-5" />
          <span>{workspace.name}</span>
        </button>
      </SidebarMenuButton>
      <SidebarMenuAction onClick={handleEdit} className="hover:cursor-pointer">
        <Edit2 className="h-4 w-4" />
      </SidebarMenuAction>
    </SidebarMenuItem>
  )
}
