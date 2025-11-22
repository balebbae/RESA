"use client"

import * as React from "react"
import { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from "react"
import { ChevronRight, Pencil } from "lucide-react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/resa/sidebar-core/sidebar"
import { Button } from "@/components/ui/button"
import { useEmployees } from "@/hooks/use-employees"
import { EmployeeDetailSheet } from "./employee-detail-sheet"
import type { Employee } from "@/types/employee"
import { generateEmployeeColors } from "@/components/resa/schedule/utils/employee-colors"
import type { EmployeeDragData } from "@/types/schedule"

interface EmployeeCollapsibleSectionProps {
  restaurantId: number | null
}

export interface EmployeeCollapsibleSectionRef {
  refetch: () => void
}

/**
 * Individual draggable employee item
 */
interface DraggableEmployeeItemProps {
  employee: Employee;
  color: string;
  onEdit: () => void;
}

function DraggableEmployeeItem({ employee, color, onEdit }: DraggableEmployeeItemProps) {
  const dragData: EmployeeDragData = {
    type: 'employee',
    employeeId: employee.id,
    employeeName: employee.full_name,
    employeeColor: color,
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `employee-${employee.id}`,
    data: dragData,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <SidebarMenuItem key={employee.id}>
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center w-full gap-2 px-2 py-2 rounded-md hover:bg-sidebar-accent group relative"
      >
        {/* Draggable area - applies listeners here */}
        <div
          {...listeners}
          {...attributes}
          className="flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing"
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm truncate">{employee.full_name}</span>
            <span className="text-xs text-muted-foreground truncate">
              {employee.email}
            </span>
          </div>
        </div>

        {/* Edit button - separate from drag area */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleEditClick}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </SidebarMenuItem>
  );
}

/**
 * Collapsible section for employees
 * Displays employees in a collapsible sidebar section with drag and drop functionality
 */
export const EmployeeCollapsibleSection = forwardRef<
  EmployeeCollapsibleSectionRef,
  EmployeeCollapsibleSectionProps
>(function EmployeeCollapsibleSection({
  restaurantId,
}, ref) {
  const { employees, refetch } = useEmployees(restaurantId)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Generate employee colors
  const employeeColorMap = useMemo(() => {
    return generateEmployeeColors(employees.map(emp => emp.id));
  }, [employees])

  // Expose refetch method to parent component
  useImperativeHandle(ref, () => ({
    refetch,
  }))

  // Update selected employee when employees list changes
  useEffect(() => {
    if (selectedEmployee && employees.length > 0) {
      const updatedEmployee = employees.find(emp => emp.id === selectedEmployee.id)
      if (updatedEmployee) {
        setSelectedEmployee(updatedEmployee)
      }
    }
  }, [employees, selectedEmployee?.id])

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsSheetOpen(true)
  }

  const handleEmployeeUpdate = () => {
    refetch()
  }

  // Show message when no restaurant is selected
  if (!restaurantId) {
    return (
      <>
        <SidebarGroup className="py-0">
          <SidebarGroupLabel className="text-sidebar-foreground text-sm">
            Employees
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Select a workplace to view employees
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="mx-0" />
      </>
    )
  }

  return (
    <>
      {/* Employees Section */}
      <SidebarGroup className="py-0">
        <Collapsible defaultOpen={true} className="group/collapsible">
          <SidebarGroupLabel
            asChild
            className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm hover:cursor-pointer"
          >
            <CollapsibleTrigger>
              Employees{" "}
              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </CollapsibleTrigger>


          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {employees.length === 0 ? (
                  <div className="px-2 py-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No employees yet
                    </p>
                  </div>
                ) : (
                  employees.map((employee) => (
                    <DraggableEmployeeItem
                      key={employee.id}
                      employee={employee}
                      color={employeeColorMap.get(employee.id) || 'hsl(0, 0%, 70%)'}
                      onEdit={() => handleEmployeeClick(employee)}
                    />
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
      <SidebarSeparator className="mx-0" />

      {/* Employee Detail Sheet */}
      <EmployeeDetailSheet
        employee={selectedEmployee}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        restaurantId={restaurantId}
        onSuccess={handleEmployeeUpdate}
      />
    </>
  )
})
