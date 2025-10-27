"use client"

import { useState } from "react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/resa/sidebar-core/sidebar"
import { EmployeeListItem } from "./employee-list-item"
import { EmployeeEmptyState } from "./employee-empty-state"
import { EmployeeFormDialog } from "./employee-form-dialog"
import { useEmployees } from "./hooks/use-employees"
import { useRestaurant } from "@/lib/restaurant-context"

/**
 * Main employee list component
 * Shows employees for the selected restaurant
 * Similar to WorkspaceList but for employees
 */
export function EmployeeList() {
  const { selectedRestaurantId, selectedRestaurantName } = useRestaurant()
  const { employees, refetch } = useEmployees(selectedRestaurantId)
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleEdit = (employeeId: number) => {
    setEditingEmployeeId(employeeId)
    setIsEditDialogOpen(true)
  }

  const handleSuccess = () => {
    setIsEditDialogOpen(false)
    setEditingEmployeeId(null)
    refetch()
  }

  // Find the employee being edited to get their name
  const editingEmployee = employees.find(emp => emp.id === editingEmployeeId)

  // Show message when no restaurant is selected
  if (!selectedRestaurantId) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Employees</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-2 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Select a workplace to view employees
            </p>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between px-2">
        <SidebarGroupLabel>
          {selectedRestaurantName ? `${selectedRestaurantName} Employees` : "Employees"}
        </SidebarGroupLabel>
        <EmployeeFormDialog
          mode="create"
          restaurantId={selectedRestaurantId}
          onSuccess={handleSuccess}
        />
      </div>
      <SidebarGroupContent>
        <SidebarMenu>
          {employees.length === 0 ? (
            <EmployeeEmptyState />
          ) : (
            employees.map((employee) => (
              <EmployeeListItem
                key={employee.id}
                employee={employee}
                onEdit={handleEdit}
              />
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>

      {/* Edit Form Dialog */}
      {editingEmployeeId && (
        <EmployeeFormDialog
          mode="edit"
          restaurantId={selectedRestaurantId}
          employeeId={editingEmployeeId}
          employeeName={editingEmployee?.full_name}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleSuccess}
        />
      )}
    </SidebarGroup>
  )
}
