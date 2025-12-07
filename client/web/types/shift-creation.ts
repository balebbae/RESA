import type { Employee } from "./employee";
import type { ShiftTemplate } from "./shift-template";
import type { Role } from "./role";

/**
 * Represents pending shift data during the creation flow
 * Used when an employee has multiple roles and must select one
 */
export interface PendingShiftData {
  employee: Employee;
  template: ShiftTemplate;
  roles: Role[];
  notes?: string;
}

/**
 * Layout information for positioning shift template backgrounds
 * Calculated based on template start/end times and current hour
 */
export interface TemplateLayoutInfo {
  topOffset: number; // Offset from top of time slot in pixels
  height: number; // Height of template background in pixels
  isFirstHourSlot: boolean; // Whether this is the first hour where template appears
}
