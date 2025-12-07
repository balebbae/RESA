"use client";

// Force HMR reload
import { useState, useCallback } from "react";
import type { ShiftTemplate } from "@/types/shift-template";
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";
import type { ScheduledShift } from "@/types/schedule";
import type { PendingShiftData } from "@/types/shift-creation";
import { useScheduleManagement } from "@/hooks/use-schedule-management";
import { formatTimeToHHMM } from "@/lib/calendar/date-utils";
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-helpers";

interface UseShiftCreationFlowProps {
  restaurantId: number | null;
  scheduleId: number | null;
  weekStartDate: string | undefined;
  date: string; // YYYY-MM-DD format
  onShiftCreated?: () => void;
  addOptimisticShift?: (shift: ScheduledShift) => void;
  removeOptimisticShift?: (tempId: string | number) => void;
  confirmOptimisticShift?: (
    tempId: string | number,
    realShift: ScheduledShift
  ) => void;
  updateOptimisticShift?: (
    shiftId: string | number,
    shift: ScheduledShift
  ) => void;
}

interface UseShiftCreationFlowReturn {
  // State
  selectedTemplate: ShiftTemplate | null;
  pendingShiftData: PendingShiftData | null;
  roleDialogOpen: boolean;
  isCreatingShift: boolean;

  // Actions
  startShiftCreation: (template: ShiftTemplate) => void;
  handleEmployeeSelect: (employee: Employee, roles: Role[], notes?: string) => Promise<void>;
  handleRoleSelected: (role: Role) => Promise<void>;
  cancelShiftCreation: () => void;
  handleShiftUnassignment: (shift: ScheduledShift) => Promise<void>;
  handleShiftUpdate: (shift: ScheduledShift, changes: Partial<ScheduledShift>) => Promise<void>;
}

/**
 * Custom hook for orchestrating the multi-step shift creation workflow
 * Manages state for: template selection → employee selection → role selection → shift creation
 * Implements optimistic UI updates for immediate feedback
 * Follows pattern from use-schedule-management.tsx for action hooks
 */
export function useShiftCreationFlow({
  restaurantId,
  scheduleId,
  weekStartDate,
  date,
  onShiftCreated,
  addOptimisticShift,
  removeOptimisticShift,
  confirmOptimisticShift,
  updateOptimisticShift,
}: UseShiftCreationFlowProps): UseShiftCreationFlowReturn {
  // State for shift creation workflow
  const [selectedTemplate, setSelectedTemplate] =
    useState<ShiftTemplate | null>(null);
  const [pendingShiftData, setPendingShiftData] =
    useState<PendingShiftData | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Integrate with schedule management hook for API calls
  const {
    createShift,
    updateShift,
    unassignShift,
    isLoading: isCreatingShift,
  } = useScheduleManagement({
    restaurantId,
    onSuccess: () => {
      if (onShiftCreated) onShiftCreated();
    },
    onError: (error) => {
      showErrorToast(
        "Failed to modify shift",
        error instanceof Error ? error : new Error(String(error))
      );
    },
  });

  /**
   * Start the shift creation flow by selecting a template
   */
  const startShiftCreation = useCallback((template: ShiftTemplate) => {
    setSelectedTemplate(template);
  }, []);

  /**
   * Handle immediate shift creation with optimistic UI update
   */
  const createShiftWithOptimisticUpdate = useCallback(
    async (employee: Employee, role: Role, template: ShiftTemplate, notes: string = "") => {
      if (!weekStartDate) return;

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // Create optimistic shift object to show immediately
      const optimisticShift: ScheduledShift = {
        id: tempId as any, // Temporary ID (will be replaced with real ID)
        schedule_id: scheduleId || 0,
        restaurant_id: restaurantId || 0,
        shift_template_id: template.id,
        role_id: role.id,
        employee_id: employee.id,
        shift_date: date,
        start_time: formatTimeToHHMM(template.start_time),
        end_time: formatTimeToHHMM(template.end_time),
        notes: notes,
        employee_name: employee.full_name,
        role_name: role.name,
        role_color: role.color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to UI immediately (optimistic update)
      if (addOptimisticShift) {
        addOptimisticShift(optimisticShift);
      }

      // Clear all state immediately for instant feedback
      setSelectedTemplate(null);
      setRoleDialogOpen(false);
      setPendingShiftData(null);
      setSelectedRole(null);

      // Create shift in background
      try {
        const realShift = await createShift(scheduleId || null, weekStartDate, {
          shift_template_id: template.id,
          role_id: role.id,
          employee_id: employee.id,
          shift_date: date,
          start_time: formatTimeToHHMM(template.start_time),
          end_time: formatTimeToHHMM(template.end_time),
          notes: notes,
        });

        // Replace optimistic shift with real data
        if (confirmOptimisticShift && realShift) {
          confirmOptimisticShift(tempId, realShift);
        }

        showSuccessToast("Employee assigned successfully");
      } catch (error) {
        console.error("Failed to create shift:", error);

        // Remove optimistic shift on error
        if (removeOptimisticShift) {
          removeOptimisticShift(tempId);
        }

        showErrorToast(
          "Failed to create shift",
          error instanceof Error ? error : new Error("Unknown error")
        );
      }
    },
    [
      weekStartDate,
      scheduleId,
      restaurantId,
      date,
      createShift,
      addOptimisticShift,
      removeOptimisticShift,
      confirmOptimisticShift,
    ]
  );

  /**
   * Handle shift update with optimistic UI update
   */
  const handleShiftUpdate = useCallback(
    async (shift: ScheduledShift, changes: Partial<ScheduledShift>) => {
      // Optimistic update
      if (updateOptimisticShift) {
        updateOptimisticShift(shift.id, { ...shift, ...changes });
      }

      // Clear selection state
      setSelectedTemplate(null);
      setRoleDialogOpen(false);
      setPendingShiftData(null);
      setSelectedRole(null);

      try {
        await updateShift(shift.schedule_id, shift.id, {
           notes: changes.notes,
           // Add other fields if needed
        });
        showSuccessToast("Shift updated successfully");
      } catch (error) {
        console.error("Failed to update shift:", error);
        // Revert optimistic update? 
        // For now, relies on refetch or parent to handle error state visually
        // ideally we would revert using the original shift data
        showErrorToast(
          "Failed to update shift",
          error instanceof Error ? error : new Error("Unknown error")
        );
      }
    },
    [updateShift, updateOptimisticShift]
  );

  /**
   * Handle employee selection from popover
   * If employee has one role: create shift immediately
   * If employee has multiple roles: show role selector dialog
   */
  const handleEmployeeSelect = useCallback(
    async (employee: Employee, roles: Role[], notes: string = "") => {
      if (!selectedTemplate) return;

      // Check if employee has roles
      if (roles.length === 0) {
        showErrorToast("Employee has no assigned roles");
        return;
      }

      // Store pending data
      setPendingShiftData({
        employee,
        template: selectedTemplate,
        roles,
        notes,
      });

      if (roles.length === 1) {
        // Single role: create shift immediately
        setSelectedRole(roles[0]);
        await createShiftWithOptimisticUpdate(
          employee,
          roles[0],
          selectedTemplate,
          notes
        );
      } else {
        // Multiple roles: show role selector
        setRoleDialogOpen(true);
        setSelectedTemplate(null); // Close the popover
      }
    },
    [selectedTemplate, createShiftWithOptimisticUpdate]
  );

  /**
   * Handle role selection from role selector dialog
   */
  const handleRoleSelected = useCallback(
    async (role: Role) => {
      if (!pendingShiftData) return;

      setSelectedRole(role);
      setRoleDialogOpen(false);

      // Create shift immediately
      await createShiftWithOptimisticUpdate(
        pendingShiftData.employee,
        role,
        pendingShiftData.template,
        pendingShiftData.notes || ""
      );
    },
    [pendingShiftData, createShiftWithOptimisticUpdate]
  );

  /**
   * Cancel the shift creation flow and reset all state
   */
  const cancelShiftCreation = useCallback(() => {
    setSelectedTemplate(null);
    setRoleDialogOpen(false);
    setPendingShiftData(null);
    setSelectedRole(null);
  }, []);

  /**
   * Handle shift unassignment
   * Waits for backend response instead of optimistic update to ensure data integrity
   */
  const handleShiftUnassignment = useCallback(
    async (shift: ScheduledShift) => {
      try {
        console.log("Unassigning shift:", {
          shiftId: shift.id,
          employeeId: shift.employee_id,
          scheduleId: shift.schedule_id,
        });

        // Call API and get authoritative updated shift
        const updatedShift = await unassignShift(shift.schedule_id, shift.id);

        console.log("Received updated shift from API:", {
          shiftId: updatedShift.id,
          employeeId: updatedShift.employee_id,
          shiftDate: updatedShift.shift_date,
          startTime: updatedShift.start_time,
        });

        // Log the full shift for debugging
        console.log("Full shift response after normalization:", updatedShift);

        // Validate the response has required fields with detailed error
        if (!updatedShift.start_time || !updatedShift.shift_date) {
          console.error("Validation failed - missing fields:", {
            has_start_time: !!updatedShift.start_time,
            start_time_value: updatedShift.start_time,
            start_time_type: typeof updatedShift.start_time,
            has_shift_date: !!updatedShift.shift_date,
            shift_date_value: updatedShift.shift_date,
            shift_date_type: typeof updatedShift.shift_date,
            full_shift: updatedShift,
          });
          throw new Error(
            `Backend returned shift with missing required fields: ` +
              `start_time=${
                updatedShift.start_time
              } (${typeof updatedShift.start_time}), ` +
              `shift_date=${
                updatedShift.shift_date
              } (${typeof updatedShift.shift_date})`
          );
        }

        // Update with real backend data (which has ALL required fields)
        if (updateOptimisticShift) {
          updateOptimisticShift(shift.id, updatedShift);
        }

        showSuccessToast("Employee unassigned successfully");
      } catch (error) {
        console.error("Failed to unassign shift:", error);
        showErrorToast(
          "Failed to unassign employee",
          error instanceof Error ? error : new Error("Unknown error")
        );
        // No rollback needed - shift was never optimistically updated
      }
    },
    [unassignShift, updateOptimisticShift]
  );

  return {
    // State
    selectedTemplate,
    pendingShiftData,
    roleDialogOpen,
    isCreatingShift,

    // Actions
    startShiftCreation,
    handleEmployeeSelect,
    handleRoleSelected,
    cancelShiftCreation,
    handleShiftUnassignment,
    handleShiftUpdate,
  };
}
