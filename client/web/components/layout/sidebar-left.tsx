"use client";

import * as React from "react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { WorkspaceList } from "@/components/workspaces/workspace-list";
import { RoleLegend } from "@/components/roles/role-legend";
import { useWorkplaces } from "@/hooks/use-workplaces";
import { FlowButton } from "./flow-button";
import { useAuth } from "@/lib/auth";
import { SendScheduleDialog } from "@/components/schedules/send-schedule-dialog";

/**
 * Left sidebar component - Simplified and refactored
 * - Extracted data fetching to useWorkplaces hook
 * - Extracted user menu to UserMenu component
 * - Extracted workspace list to WorkspaceList component
 */
export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const { workplaces, refetch } = useWorkplaces();
  const { user } = useAuth();

  const userData = {
    name: user
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : "Guest",
    email: user?.email || "",
    avatar: user?.avatar_url || "",
  };

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <UserMenu user={userData} />
      </SidebarHeader>
      <SidebarContent>
        <WorkspaceList workplaces={workplaces} onWorkplaceChange={refetch} />
        <RoleLegend />
      </SidebarContent>
      <SidebarFooter className="p-4">
        <FlowButton
          text="Generate Schedule"
          onClick={() => setSendDialogOpen(true)}
        />
      </SidebarFooter>
      <SidebarRail />

      {/* Send Schedule Dialog */}
      <SendScheduleDialog
        isOpen={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
      />
    </Sidebar>
  );
}
