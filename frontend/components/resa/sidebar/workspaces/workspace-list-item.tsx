"use client"

import { Edit2 } from "lucide-react"
import {
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuItem,
} from "@/components/resa/sidebar/core/sidebar"
import { WorkspaceIcon } from "./workspace-icon"
import type { Workspace } from "../types/workspace"

interface WorkspaceListItemProps {
  workspace: Workspace
  onEdit: (workspaceId: number) => void
}

/**
 * Individual workspace list item with edit action
 * Extracted from nav-workspaces for better separation
 */
export function WorkspaceListItem({ workspace, onEdit }: WorkspaceListItemProps) {
  const handleEdit = () => {
    if (workspace.id) {
      onEdit(workspace.id)
    } else {
      console.error("Cannot edit workspace without valid ID:", workspace)
    }
  }

  return (
    <SidebarMenuItem key={workspace.name}>
      <SidebarMenuButton asChild>
        <a href="#" className="flex items-center gap-2">
          <WorkspaceIcon className="h-5 w-5" />
          <span>{workspace.name}</span>
        </a>
      </SidebarMenuButton>
      <SidebarMenuAction onClick={handleEdit}>
        <Edit2 className="h-4 w-4" />
      </SidebarMenuAction>
    </SidebarMenuItem>
  )
}
