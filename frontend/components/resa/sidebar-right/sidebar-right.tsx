"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import {
  Sidebar,
  SidebarContent,
  SidebarSeparator,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/resa/sidebar-core/sidebar"
import { DatePicker } from "./calendar/date-picker"
import { EmployeeCollapsibleSections, type EmployeeCollapsibleSectionsRef } from "./employees/employee-collapsible-sections"
import { EmployeeFormDialog } from "./employees/employee-form-dialog"
import { RoleFormDialog } from "./roles/role-form-dialog"
import { useRestaurant } from "@/lib/restaurant-context"

/**
 * Right sidebar component - Matches original collapsible pattern
 * - Date picker for calendar navigation
 * - Collapsible sections for employees and roles
 * - Footer with "Create Employee" button
 */
export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { selectedRestaurantId } = useRestaurant()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false)
  const employeeSectionsRef = useRef<EmployeeCollapsibleSectionsRef>(null)

  const handleCreateEmployee = () => {
    if (!selectedRestaurantId) {
      toast.error("Please select a workplace first", {
        description: "You need to select a workplace before creating an employee."
      })
      return
    }
    setIsCreateDialogOpen(true)
  }

  const handleCreateRole = () => {
    if (!selectedRestaurantId) {
      toast.error("Please select a workplace first", {
        description: "You need to select a workplace before creating a role."
      })
      return
    }
    setIsCreateRoleDialogOpen(true)
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    // Refresh the employee list after successful creation
    employeeSectionsRef.current?.refetch()
  }

  const handleCreateRoleSuccess = () => {
    setIsCreateRoleDialogOpen(false)
    // Refresh the role list after successful creation
    employeeSectionsRef.current?.refetch()
  }

  return (
    <>
      <Sidebar
        collapsible="none"
        className="sticky top-0 hidden h-svh border-l lg:flex"
        {...props}
      >
        <SidebarContent>
          <DatePicker />
          <SidebarSeparator className="mx-0" />
          <EmployeeCollapsibleSections
            ref={employeeSectionsRef}
            restaurantId={selectedRestaurantId}
          />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarSeparator className="mx-0" />
              <SidebarMenuButton onClick={handleCreateRole} className="hover:cursor-pointer">
                <Plus />
                <span>Create Role</span>
              </SidebarMenuButton>
              <SidebarSeparator className="mx-0" />
              <SidebarMenuButton onClick={handleCreateEmployee} className="hover:cursor-pointer">
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
      />

      {/* Create Role Dialog */}
      <RoleFormDialog
        restaurantId={selectedRestaurantId}
        isOpen={isCreateRoleDialogOpen}
        onOpenChange={setIsCreateRoleDialogOpen}
        onSuccess={handleCreateRoleSuccess}
      />
    </>
  )
}
