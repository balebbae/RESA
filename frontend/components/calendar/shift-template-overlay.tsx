"use client";

import { useMemo, useState, useEffect } from "react";
import type { ShiftTemplate } from "@/types/shift-template";
import type { ScheduledShift } from "@/types/schedule";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";
import { formatTimeToHHMM } from "@/lib/calendar/date-utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { RoleColorIndicator } from "@/components/calendar/role-color-indicator";

interface ShiftTemplateOverlayProps {
  template: ShiftTemplate;
  date: string;
  position: {
    top: string;
    height: string;
    left: string;
    width: string;
  };
  assignedShifts: ScheduledShift[];
  isHovered: boolean;
  onTemplateClick: (template: ShiftTemplate) => void;
  onTemplateHover: (templateId: number | null) => void;
  // Popover integration
  isPopoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  employees: Employee[];
  employeesWithRoles: Map<number, Role[]>;
  loadingRoles: boolean;
  onEmployeeSelect: (employee: Employee, roleId: number) => void;
  onShiftUnassign: (shift: ScheduledShift) => void;
  onRoleClick: (
    template: ShiftTemplate,
    roleId: number,
    roleName: string
  ) => void;
  selectedRoleId: number | null;
  // Role data
  roles: Role[];
  roleMap: Map<number, Role>;
  rolesLoading: boolean;
}

/**
 * Full event card for shift template overlay
 * Renders the complete template spanning its full duration
 * Used in the overlay layer for proper z-index stacking
 */
export function ShiftTemplateOverlay({
  template,
  date: _date,
  position,
  assignedShifts,
  isHovered,
  onTemplateClick,
  onTemplateHover,
  isPopoverOpen,
  onPopoverOpenChange,
  employees,
  employeesWithRoles,
  loadingRoles,
  onEmployeeSelect,
  onShiftUnassign,
  onRoleClick,
  selectedRoleId,
  roles: _roles,
  roleMap,
  rolesLoading,
}: ShiftTemplateOverlayProps) {
  // Local state to track employees being unassigned (for immediate UI feedback)
  const [pendingUnassignments, setPendingUnassignments] = useState<Set<number>>(
    new Set()
  );

  // Clean up pending unassignments when assignedShifts actually updates
  // (employee removed from assignedShifts = unassignment succeeded)
  useEffect(() => {
    if (pendingUnassignments.size === 0) return;

    // Check which pending unassignments have completed
    // by verifying the employee is no longer in assignedShifts
    setPendingUnassignments((prev) => {
      const updated = new Set(prev);
      prev.forEach((employeeId) => {
        const stillAssigned = assignedShifts.some(
          (shift) => shift.employee_id === employeeId
        );
        if (!stillAssigned) {
          // Employee successfully unassigned, remove from pending
          updated.delete(employeeId);
          console.log("Employee unassignment completed:", employeeId);
        }
      });
      return updated;
    });
  }, [assignedShifts]); // Only depend on assignedShifts to avoid infinite loop

  // Safety timeout: clear stuck pending unassignments after 5 seconds
  useEffect(() => {
    if (pendingUnassignments.size === 0) return;

    const timeout = setTimeout(() => {
      if (pendingUnassignments.size > 0) {
        console.warn(
          "Clearing stuck pending unassignments:",
          Array.from(pendingUnassignments)
        );
        setPendingUnassignments(new Set());
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [pendingUnassignments]);

  const backgroundColor = "rgba(192, 238, 211, 0.6)"; // Light green (#CDFFD8) with slight opacity

  // Create set of employee IDs who are already assigned to this template on this date
  const assignedEmployeeIds = useMemo(() => {
    return new Set(
      assignedShifts
        .filter((shift) => shift.employee_id !== null)
        .map((shift) => shift.employee_id!)
    );
  }, [assignedShifts]);

  // Group shifts by role to display role labels with assigned employees
  const roleShifts = useMemo(() => {
    const map = new Map<number, ScheduledShift>();
    assignedShifts.forEach((shift) => {
      map.set(shift.role_id, shift);
    });
    return map;
  }, [assignedShifts]);

  // Get full Role objects for template's role_ids
  const templateRoles = useMemo(() => {
    if (!template.role_ids || template.role_ids.length === 0) {
      return [];
    }
    return template.role_ids
      .map((roleId) => roleMap.get(roleId))
      .filter((role): role is Role => role !== undefined);
  }, [template.role_ids, roleMap]);

  // Parse height to determine content visibility
  const heightPx = parseFloat(position.height);
  const canShowRoles = heightPx >= 60; // Show roles if at least 1 hour

  return (
    <Popover open={isPopoverOpen} onOpenChange={onPopoverOpenChange}>
      <PopoverTrigger asChild>
        <div
          data-overlay
          className={`absolute cursor-pointer transition-opacity pointer-events-auto ${
            isHovered ? "opacity-90 z-20" : "opacity-100 z-10"
          }`}
          style={{
            backgroundColor,
            top: position.top,
            height: position.height,
            left: position.left,
            width: position.width,
          }}
          onClick={() => onTemplateClick(template)}
          onMouseEnter={() => onTemplateHover(template.id)}
          onMouseLeave={() => onTemplateHover(null)}
        >
          {/* Template content - always visible (no cell clipping) */}
          <div className="absolute inset-0 p-2 text-black flex flex-col overflow-hidden">
            {/* Template Name */}
            <div className="text-xs font-medium truncate">{template.name}</div>

            {/* Divider line */}
            {canShowRoles && <div className="border-t border-black/20 my-1" />}

            {/* Scrollable roles container */}
            {canShowRoles && (
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {rolesLoading ? (
                  <div className="text-[9px] leading-tight opacity-70 italic animate-pulse">
                    Loading roles...
                  </div>
                ) : templateRoles.length > 0 ? (
                  <div className="space-y-0.5 pr-1">
                    {templateRoles.map((role) => {
                      const assignedShift = roleShifts.get(role.id);

                      return (
                        <div
                          key={role.id}
                          className={`text-[11px] leading-tight truncate opacity-90 hover:opacity-100 cursor-pointer hover:underline flex items-center gap-1 ${
                            selectedRoleId === role.id
                              ? "font-bold opacity-100"
                              : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRoleClick(template, role.id, role.name);
                          }}
                        >
                          {/* Role color indicator */}
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: role.color }}
                          />

                          {/* Role name and employee */}
                          <span className="truncate">
                            {role.name}
                            {assignedShift?.employee_name
                              ? `: ${assignedShift.employee_name}`
                              : ": "}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[9px] leading-tight opacity-70 italic">
                    No roles defined for this template
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-70 max-h-78 overflow-y-auto">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-sm mb-1">
              Select Employee for {template.name}
              {selectedRoleId && (
                <span className="text-primary">
                  {" "}
                  ({roleMap.get(selectedRoleId)?.name || "Unknown Role"})
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mb-1">
              {formatTimeToHHMM(template.start_time)} -{" "}
              {formatTimeToHHMM(template.end_time)}
            </p>

            {/* Help text when no role selected */}
            {!selectedRoleId && templateRoles.length > 0 && (
              <p className="text-xs text-muted-foreground italic mt-1">
                Click a role above to select employees for that position
              </p>
            )}
          </div>

          {loadingRoles ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No employees available
            </div>
          ) : (
            <div className="space-y-1">
              {employees.map((employee) => {
                const roles = employeesWithRoles.get(employee.id) || [];
                const isAssigned =
                  assignedEmployeeIds.has(employee.id) &&
                  !pendingUnassignments.has(employee.id);

                return (
                  <div
                    key={employee.id}
                    className={`flex items-start gap-3 p-1 rounded-md transition-colors ${
                      isAssigned
                        ? "opacity-60 cursor-not-allowed bg-muted/50"
                        : !selectedRoleId
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-accent cursor-pointer"
                    }`}
                    onClick={() =>
                      !isAssigned &&
                      selectedRoleId &&
                      onEmployeeSelect(employee, selectedRoleId)
                    }
                    title={
                      !selectedRoleId && !isAssigned
                        ? "Select a role first by clicking it above"
                        : undefined
                    }
                  >
                    <div className="mt-1">
                      <RoleColorIndicator roles={roles} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium truncate">
                          {employee.full_name}
                        </div>
                        {isAssigned && (
                          <span className="text-xs text-muted-foreground">
                            (Assigned)
                          </span>
                        )}
                      </div>
                      {roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {roles.map((role) => (
                            <Badge
                              key={role.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {isAssigned && (
                      <button
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                        onClick={(e) => {
                          e.stopPropagation();

                          // Find the shift for this employee
                          const shiftToRemove = assignedShifts.find(
                            (shift) => shift.employee_id === employee.id
                          );

                          if (shiftToRemove) {
                            // Immediately add to pending set for instant UI feedback
                            setPendingUnassignments((prev) =>
                              new Set(prev).add(employee.id)
                            );

                            onShiftUnassign(shiftToRemove);
                          }
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
