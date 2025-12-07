"use client";

import { useState, useMemo } from "react";
import type { ShiftTemplate } from "@/types/shift-template";
import type { ScheduledShift } from "@/types/schedule";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";
import { useRestaurant } from "@/contexts/restaurant-context";
import { useShiftTemplateContext } from "@/contexts/shift-template-context";
import { useShiftCreationFlow } from "@/hooks/use-shift-creation-flow";
import { useEmployeeRoles } from "@/hooks/use-employee-roles";
import { RoleSelectorDialog } from "@/components/shifts/role-selector-dialog";
import { ShiftTemplateOverlay } from "./shift-template-overlay";
import { ShiftTemplateFormDialog } from "@/components/schedules/shift-template-form-dialog";
import {
  filterTemplatesForDay,
  assignColumnsToTemplates,
  calculateTemplateStyles,
} from "@/lib/calendar/overlap-utils";

interface DayColumnOverlayProps {
  date: string; // YYYY-MM-DD
  dayIndex: number; // 0-6 for positioning
  columnWidth: number; // Width of this day column in pixels
  shiftTemplates: ShiftTemplate[];
  shifts: ScheduledShift[];
  employees: Employee[];
  scheduleId: number | null;
  weekStartDate: string;
  onShiftCreated?: () => void;
  hoveredTemplateId: number | null;
  onTemplateHover: (templateId: number | null) => void;
  addOptimisticShift?: (shift: ScheduledShift) => void;
  removeOptimisticShift?: (tempId: string | number) => void;
  confirmOptimisticShift?: (tempId: string | number, realShift: ScheduledShift) => void;
  updateOptimisticShift?: (shiftId: string | number, shift: ScheduledShift) => void;
  roles: Role[];
  roleMap: Map<number, Role>;
  rolesLoading: boolean;
}

const PIXELS_PER_HOUR = 60;

/**
 * Overlay for a single day column
 * Handles overlap detection and renders ShiftTemplateOverlay for each template
 */
export function DayColumnOverlay({
  date,
  dayIndex,
  columnWidth,
  shiftTemplates,
  shifts,
  employees,
  scheduleId,
  weekStartDate,
  onShiftCreated,
  hoveredTemplateId,
  onTemplateHover,
  addOptimisticShift,
  removeOptimisticShift,
  confirmOptimisticShift,
  updateOptimisticShift,
  roles,
  roleMap,
  rolesLoading,
}: DayColumnOverlayProps) {
  const { selectedRestaurantId } = useRestaurant();
  const { refetch: refetchTemplates } = useShiftTemplateContext();

  // Track which role was clicked for filtering employees
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  
  // Track which template is being edited
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  // Filter templates for this specific day
  const templatesForDay = useMemo(
    () => filterTemplatesForDay(shiftTemplates, date),
    [shiftTemplates, date]
  );

  // Calculate column assignments for overlapping templates
  const columnAssignments = useMemo(
    () => assignColumnsToTemplates(templatesForDay, date, PIXELS_PER_HOUR),
    [templatesForDay, date]
  );

  // Shift creation flow for this day
  const {
    selectedTemplate,
    pendingShiftData,
    roleDialogOpen,
    startShiftCreation,
    handleEmployeeSelect,
    handleRoleSelected,
    cancelShiftCreation,
    handleShiftUnassignment,
  } = useShiftCreationFlow({
    restaurantId: selectedRestaurantId,
    scheduleId,
    weekStartDate,
    date,
    onShiftCreated,
    addOptimisticShift,
    removeOptimisticShift,
    confirmOptimisticShift,
    updateOptimisticShift,
  });

  // Fetch employee roles (only when a template is selected)
  const { employeesWithRoles, isLoading: loadingRoles } = useEmployeeRoles({
    restaurantId: selectedRestaurantId,
    employees,
    enabled: !!selectedTemplate,
  });

  // Filter employees by selected role
  const filteredEmployees = useMemo(() => {
    if (!selectedRoleId) {
      return employees;
    }
    return employees.filter((employee) => {
      const empRoles = employeesWithRoles.get(employee.id) || [];
      return empRoles.some((role) => role.id === selectedRoleId);
    });
  }, [selectedRoleId, employees, employeesWithRoles]);

  // Handle role click - opens popover with filtered employees
  const handleRoleClick = (
    template: ShiftTemplate,
    roleId: number,
    _roleName: string
  ) => {
    setSelectedRoleId(roleId);
    if (!selectedTemplate || selectedTemplate.id !== template.id) {
      startShiftCreation(template);
    }
  };

  // Handle employee selection
  const onEmployeeSelect = async (employee: Employee, roleId: number) => {
    const empRoles = employeesWithRoles.get(employee.id) || [];
    const selectedRole = empRoles.find((r) => r.id === roleId);

    if (selectedRole && selectedTemplate) {
      await handleEmployeeSelect(employee, [selectedRole]);
      setSelectedRoleId(null);
    } else {
      await handleEmployeeSelect(employee, empRoles);
    }
  };

  // Get shifts assigned to a specific template on this date
  const getAssignedShifts = (templateId: number): ScheduledShift[] => {
    return shifts.filter((shift) => {
      if (!shift.shift_date || shift.shift_template_id === undefined) {
        return false;
      }
      const shiftDateOnly = shift.shift_date.split("T")[0];
      return shift.shift_template_id === templateId && shiftDateOnly === date;
    });
  };

  const handleTemplateClick = (template: ShiftTemplate) => {
    setEditingTemplateId(template.id);
  };

  if (columnAssignments.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute top-0 bottom-0"
      style={{
        left: `${dayIndex * columnWidth}px`,
        width: `${columnWidth}px`,
      }}
    >
      {columnAssignments.map((assignment) => {
        const styles = calculateTemplateStyles(assignment);
        const assignedShifts = getAssignedShifts(assignment.template.id);
        const isPopoverOpen =
          !!selectedTemplate && selectedTemplate.id === assignment.template.id;

        return (
          <ShiftTemplateOverlay
            key={assignment.template.id}
            template={assignment.template}
            date={date}
            position={styles}
            assignedShifts={assignedShifts}
            isHovered={hoveredTemplateId === assignment.template.id}
            onTemplateClick={handleTemplateClick}
            onTemplateHover={onTemplateHover}
            isPopoverOpen={isPopoverOpen}
            onPopoverOpenChange={(open) => {
              if (!open) {
                setSelectedRoleId(null);
                cancelShiftCreation();
              }
            }}
            employees={filteredEmployees}
            employeesWithRoles={employeesWithRoles}
            loadingRoles={loadingRoles}
            onEmployeeSelect={onEmployeeSelect}
            onShiftUnassign={handleShiftUnassignment}
            onRoleClick={handleRoleClick}
            selectedRoleId={selectedRoleId}
            roles={roles}
            roleMap={roleMap}
            rolesLoading={rolesLoading}
          />
        );
      })}

      {/* Role Selector Dialog */}
      {pendingShiftData && (
        <RoleSelectorDialog
          isOpen={roleDialogOpen}
          onOpenChange={(open) => !open && cancelShiftCreation()}
          roles={pendingShiftData.roles}
          employeeName={pendingShiftData.employee.full_name}
          onSelectRole={handleRoleSelected}
        />
      )}

      {/* Edit Shift Template Dialog */}
      <ShiftTemplateFormDialog
        isOpen={!!editingTemplateId}
        onOpenChange={(open) => !open && setEditingTemplateId(null)}
        restaurantId={selectedRestaurantId}
        shiftTemplateId={editingTemplateId || undefined}
        mode="edit"
        onSuccess={() => {
          setEditingTemplateId(null);
          refetchTemplates();
        }}
      />
    </div>
  );
}
