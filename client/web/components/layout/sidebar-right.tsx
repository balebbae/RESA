"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarSeparator,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { DatePicker } from "@/components/calendar/calendar-mini";
import {
  EmployeeCollapsibleSection,
  type EmployeeCollapsibleSectionRef,
} from "@/components/employees/employee-collapsible-section";
import {
  RoleCollapsibleSection,
  type RoleCollapsibleSectionRef,
} from "@/components/roles/role-collapsible-section";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { RoleFormDialog } from "@/components/roles/role-form-dialog";
import { useRestaurant } from "@/contexts/restaurant-context";
import { useWeekNavigation } from "@/contexts/week-navigation-context";

/**
 * Right sidebar component
 * - Date picker for calendar navigation
 * - Collapsible sections for employees and roles
 * - Footer with "Create Role" and "Create Employee" buttons
 */
export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { selectedRestaurantId } = useRestaurant();
  const weekNav = useWeekNavigation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const employeeSectionRef = useRef<EmployeeCollapsibleSectionRef>(null);
  const rolesSectionRef = useRef<RoleCollapsibleSectionRef>(null);

  const handleCreateEmployee = () => {
    if (!selectedRestaurantId) {
      toast.error("Please select a workplace first", {
        description:
          "You need to select a workplace before creating an employee.",
      });
      return;
    }
    setIsCreateDialogOpen(true);
  };

  const handleCreateRole = () => {
    if (!selectedRestaurantId) {
      toast.error("Please select a workplace first", {
        description: "You need to select a workplace before creating a role.",
      });
      return;
    }
    setIsCreateRoleDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    // Refresh the employee list after successful creation
    employeeSectionRef.current?.refetch();
  };

  const handleCreateRoleSuccess = () => {
    setIsCreateRoleDialogOpen(false);
    // Refresh the role list after successful creation
    rolesSectionRef.current?.refetch();
  };

  const handleRoleCreatedFromEmployeeForm = () => {
    // Refresh the role list when a role is created from within the employee form
    rolesSectionRef.current?.refetch();
  };

  return (
    <>
      <Sidebar
        collapsible="none"
        className="hidden h-full border-l lg:flex"
        {...props}
      >
        <SidebarContent>
          <DatePicker currentWeek={weekNav?.currentWeek} />
          <SidebarSeparator className="mx-0" />
          <EmployeeCollapsibleSection
            ref={employeeSectionRef}
            restaurantId={selectedRestaurantId}
            onRoleCreated={handleRoleCreatedFromEmployeeForm}
          />
          <RoleCollapsibleSection
            ref={rolesSectionRef}
            restaurantId={selectedRestaurantId}
          />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarSeparator className="mx-0" />
              <SidebarMenuButton
                onClick={handleCreateRole}
                className="hover:cursor-pointer"
              >
                <Plus />
                <span>Create Role</span>
              </SidebarMenuButton>
              <SidebarSeparator className="mx-0" />
              <SidebarMenuButton
                onClick={handleCreateEmployee}
                className="hover:cursor-pointer"
              >
                <Plus />
                <span>Create Employee</span>
              </SidebarMenuButton>
              <SidebarSeparator className="mx-0" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Create Employee Dialog */}
      <EmployeeFormDialog
        mode="create"
        restaurantId={selectedRestaurantId}
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
        onRoleCreated={handleRoleCreatedFromEmployeeForm}
      />

      {/* Create Role Dialog */}
      <RoleFormDialog
        restaurantId={selectedRestaurantId}
        isOpen={isCreateRoleDialogOpen}
        onOpenChange={setIsCreateRoleDialogOpen}
        onSuccess={handleCreateRoleSuccess}
      />
    </>
  );
}
