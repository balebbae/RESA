"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { ChevronRight, User } from "lucide-react"
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/resa/sidebar-core/sidebar"
import { useEmployees } from "./hooks/use-employees"
import { EmployeeDetailSheet } from "./employee-detail-sheet"
import type { Employee } from "@/components/resa/sidebar-right/types/employee"

interface EmployeeCollapsibleSectionsProps {
  restaurantId: number | null
  restaurantName: string | null
}

/**
 * Collapsible sections for employees and roles
 * Matches the original right sidebar pattern with expandable sections
 */
export function EmployeeCollapsibleSections({
  restaurantId,
  restaurantName,
}: EmployeeCollapsibleSectionsProps) {
  const { employees, refetch } = useEmployees(restaurantId)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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

  const employeesSectionName = restaurantName
    ? `${restaurantName}'s Employees`
    : "Employees"

  return (
    <>
      {/* Employees Section */}
      <SidebarGroup className="py-0">
        <Collapsible defaultOpen={true} className="group/collapsible">
          <SidebarGroupLabel
            asChild
            className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm"
          >
            <CollapsibleTrigger>
              {employeesSectionName}{" "}
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
                    <SidebarMenuItem key={employee.id}>
                      <SidebarMenuButton onClick={() => handleEmployeeClick(employee)}>
                        <User className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="text-sm">{employee.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {employee.email}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
      <SidebarSeparator className="mx-0" />

      {/* Roles Section (Placeholder) */}
      <SidebarGroup className="py-0">
        <Collapsible defaultOpen={false} className="group/collapsible">
          <SidebarGroupLabel
            asChild
            className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm"
          >
            <CollapsibleTrigger>
              Roles{" "}
              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <div className="px-2 py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No roles configured yet
                </p>
              </div>
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
}
