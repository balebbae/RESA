"use client";

import * as React from "react";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { ChevronRight, Pencil } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEmployees } from "@/hooks/use-employees";
import { useEmployeeRoles } from "@/hooks/use-employee-roles";
import { EmployeeDetailSheet } from "./employee-detail-sheet";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";

interface EmployeeCollapsibleSectionProps {
  restaurantId: number | null;
  onRoleCreated?: () => void | Promise<void>;
}

export interface EmployeeCollapsibleSectionRef {
  refetch: () => void;
}

/**
 * Individual employee item
 */
interface EmployeeItemProps {
  employee: Employee;
  roles: Role[];
  onEdit: () => void;
}

function EmployeeItem({ employee, roles, onEdit }: EmployeeItemProps) {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <SidebarMenuItem key={employee.id}>
      <SidebarMenuButton
        onClick={handleEditClick}
        className="p-1 hover:cursor-pointer"
      >
        {/* <SidebarSeparator className="mx-0" /> */}
        <div className="flex items-center w-full gap-0 px-2 py-2 rounded-md hover:bg-sidebar-accent group relative ">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {/* Name + roles together */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs  truncate">{employee.full_name}</span>

              {roles.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {roles.map((role) => (
                    <Badge
                      key={role.id}
                      className="text-xs whitespace-nowrap rounded-full font-light bg-[#ebedf1f4] text-secondary-foreground border-transparent"
                    >
                      {role.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  No roles
                </span>
              )}
            </div>
          </div>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/**
 * Collapsible section for employees
 * Displays employees in a collapsible sidebar section
 */
export const EmployeeCollapsibleSection = forwardRef<
  EmployeeCollapsibleSectionRef,
  EmployeeCollapsibleSectionProps
>(function EmployeeCollapsibleSection({ restaurantId, onRoleCreated }, ref) {
  const { employees, refetch } = useEmployees(restaurantId);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch employee roles to display as badges
  const { employeesWithRoles, refetch: refetchRoles } = useEmployeeRoles({
    restaurantId,
    employees,
    enabled: true, // Always enabled for sidebar display
  });

  // Expose refetch method to parent component
  useImperativeHandle(ref, () => ({
    refetch: () => {
      refetch();
      refetchRoles();
    },
  }));

  // Update selected employee when employees list changes
  useEffect(() => {
    if (selectedEmployee && employees.length > 0) {
      const updatedEmployee = employees.find(
        (emp) => emp.id === selectedEmployee.id
      );
      if (updatedEmployee) {
        setSelectedEmployee(updatedEmployee);
      }
    }
  }, [employees, selectedEmployee?.id]);

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsSheetOpen(true);
  };

  const handleEmployeeUpdate = () => {
    refetch();
    refetchRoles();
  };

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
    );
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
                    <EmployeeItem
                      key={employee.id}
                      employee={employee}
                      roles={employeesWithRoles.get(employee.id) || []}
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
        onRoleCreated={onRoleCreated}
      />
    </>
  );
});
