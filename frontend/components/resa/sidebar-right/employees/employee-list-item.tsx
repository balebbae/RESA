"use client"

import { Edit2, User } from "lucide-react"
import {
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuItem,
} from "@/components/resa/sidebar-core/sidebar"
import type { Employee } from "@/components/resa/sidebar-right/types/employee"

interface EmployeeListItemProps {
  employee: Employee
  onEdit: (employeeId: number) => void
}

/**
 * Individual employee list item with edit action
 * Similar to workspace-list-item but for employees
 */
export function EmployeeListItem({ employee, onEdit }: EmployeeListItemProps) {
  const handleEdit = () => {
    if (employee.id) {
      onEdit(employee.id)
    } else {
      console.error("Cannot edit employee without valid ID:", employee)
    }
  }

  return (
    <SidebarMenuItem key={employee.id}>
      <SidebarMenuButton asChild>
        <div className="flex items-center gap-4 cursor-default">
          <User className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="text-sm">{employee.full_name}</span>
            <span className="text-xs text-muted-foreground">{employee.email}</span>
          </div>
        </div>
      </SidebarMenuButton>
      <SidebarMenuAction onClick={handleEdit} className="hover:cursor-pointer">
        <Edit2 className="h-4 w-4" />
      </SidebarMenuAction>
    </SidebarMenuItem>
  )
}
