"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { WorkspaceList } from "@/components/workspaces/workspace-list";
import { RoleLegend } from "@/components/roles/role-legend";
import { useWorkplaces } from "@/hooks/use-workplaces";
import { FlowButton } from "./flow-button";

// TODO: Replace with actual user data from auth context
const TEMP_USER_DATA = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/public/logo.png",
};

/**
 * Left sidebar component - Simplified and refactored
 * - Extracted data fetching to useWorkplaces hook
 * - Extracted user menu to UserMenu component
 * - Extracted workspace list to WorkspaceList component
 */
export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { workplaces, refetch } = useWorkplaces();

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <UserMenu user={TEMP_USER_DATA} />
      </SidebarHeader>
      <SidebarContent>
        <WorkspaceList workplaces={workplaces} onWorkplaceChange={refetch} />
        <RoleLegend />
      </SidebarContent>
      <SidebarFooter className="p-4">
        <FlowButton text="Generate Schedule" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
