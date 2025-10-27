"use client"

import * as React from "react"
import { useState } from "react"
import { Plus } from "lucide-react"
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
import { EmployeeCollapsibleSections } from "./employees/employee-collapsible-sections"
import { EmployeeFormDialog } from "./employees/employee-form-dialog"
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
  const { selectedRestaurantId, selectedRestaurantName } = useRestaurant()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const handleCreateEmployee = () => {
    if (!selectedRestaurantId) {
      // Could show a toast notification here
      return
    }
    setIsCreateDialogOpen(true)
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
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
            restaurantId={selectedRestaurantId}
            restaurantName={selectedRestaurantName}
          />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleCreateEmployee}>
                <Plus />
                <span>Create Employee</span>
              </SidebarMenuButton>
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
    </>
  )
}
