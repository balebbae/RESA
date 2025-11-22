"use client"

import { useState } from "react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/resa/sidebar-core/sidebar"
import { WorkspaceListItem } from "./workspace-list-item"
import { WorkspaceEmptyState } from "./workspace-empty-state"
import { WorkspaceFormDialog } from "./workspace-form-dialog"
import type { Workspace } from "@/types/workspace"

interface WorkspaceListProps {
  workplaces: Workspace[]
  onWorkplaceChange?: () => void
}

/**
 * Main workspace list component
 * Simplified from nav-workspaces by extracting sub-components
 */
export function WorkspaceList({ workplaces, onWorkplaceChange }: WorkspaceListProps) {
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleEdit = (workspaceId: number) => {
    setEditingWorkspaceId(workspaceId)
    setIsEditDialogOpen(true)
  }

  const handleSuccess = () => {
    setIsEditDialogOpen(false)
    setEditingWorkspaceId(null)
    if (onWorkplaceChange) {
      onWorkplaceChange()
    }
  }

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between px-2">
        <SidebarGroupLabel>Workplaces</SidebarGroupLabel>
        <WorkspaceFormDialog
          mode="create"
          onSuccess={handleSuccess}
        />
      </div>
      <SidebarGroupContent>
        <SidebarMenu>
          {workplaces.length === 0 ? (
            <WorkspaceEmptyState />
          ) : (
            workplaces.map((workspace) => (
              <WorkspaceListItem
                key={workspace.id}
                workspace={workspace}
                onEdit={handleEdit}
              />
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>

      {/* Edit Form Dialog */}
      {editingWorkspaceId && (
        <WorkspaceFormDialog
          mode="edit"
          workspaceId={editingWorkspaceId}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleSuccess}
        />
      )}
    </SidebarGroup>
  )
}
