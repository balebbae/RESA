import type { ShiftTemplate } from "@/types/shift-template";
import { parseTime } from "./shift-utils";
import { getDayOfWeek } from "./shift-utils";

/**
 * Position information for a template in the calendar
 */
export interface TemplatePosition {
  template: ShiftTemplate;
  date: string;
  startHour: number; // Decimal (e.g., 9.5 for 9:30)
  endHour: number;
  top: number; // Pixels from top of grid
  height: number; // Pixels
}

/**
 * Column assignment for a template (for side-by-side overlap display)
 */
export interface ColumnAssignment {
  template: ShiftTemplate;
  column: number; // 0-indexed column within overlap group
  totalColumns: number; // Total columns in this template's overlap group
  position: TemplatePosition;
}

/**
 * Calculate the position of a template in pixels
 */
export function calculateTemplatePosition(
  template: ShiftTemplate,
  date: string,
  pixelsPerHour: number = 60
): TemplatePosition {
  const startHour = parseTime(template.start_time);
  const endHour = parseTime(template.end_time);

  // Handle overnight shifts
  const adjustedEndHour = endHour < startHour ? endHour + 24 : endHour;
  const duration = adjustedEndHour - startHour;

  return {
    template,
    date,
    startHour,
    endHour: adjustedEndHour,
    top: startHour * pixelsPerHour,
    height: duration * pixelsPerHour,
  };
}

/**
 * Filter templates for a specific day
 */
export function filterTemplatesForDay(
  templates: ShiftTemplate[],
  date: string
): ShiftTemplate[] {
  const dayOfWeek = getDayOfWeek(date);
  return templates.filter((t) => t.day_of_week === dayOfWeek);
}

/**
 * Check if two template positions overlap in time
 */
function positionsOverlap(pos1: TemplatePosition, pos2: TemplatePosition): boolean {
  return pos1.startHour < pos2.endHour && pos2.startHour < pos1.endHour;
}

/**
 * Assign columns to overlapping templates using sweep-line algorithm
 * Returns Google Calendar-style side-by-side column assignments
 */
export function assignColumnsToTemplates(
  templates: ShiftTemplate[],
  date: string,
  pixelsPerHour: number = 60
): ColumnAssignment[] {
  if (templates.length === 0) return [];

  // Calculate positions for all templates
  const positions = templates.map((t) =>
    calculateTemplatePosition(t, date, pixelsPerHour)
  );

  // Sort by start time, then by duration (longer first for visual stability)
  const sortedPositions = [...positions].sort((a, b) => {
    if (a.startHour !== b.startHour) return a.startHour - b.startHour;
    // Longer events first (they should span more columns)
    return (b.endHour - b.startHour) - (a.endHour - a.startHour);
  });

  // Assign columns using greedy algorithm
  const assignments: { position: TemplatePosition; column: number }[] = [];
  const columnEnds: number[] = []; // Tracks when each column becomes free

  for (const pos of sortedPositions) {
    // Find first column that is free (ends before or at this template's start)
    let column = columnEnds.findIndex((end) => end <= pos.startHour);

    if (column === -1) {
      // All columns occupied, create new one
      column = columnEnds.length;
      columnEnds.push(pos.endHour);
    } else {
      columnEnds[column] = pos.endHour;
    }

    assignments.push({ position: pos, column });
  }

  // Now calculate totalColumns for each template
  // Group overlapping templates to determine max columns in each group
  const result: ColumnAssignment[] = [];

  for (const assignment of assignments) {
    // Find all templates that overlap with this one
    const overlappingAssignments = assignments.filter(
      (a) =>
        positionsOverlap(a.position, assignment.position) ||
        a.position === assignment.position
    );

    // Get the max column number used in this overlap group
    const maxColumn = Math.max(...overlappingAssignments.map((a) => a.column));
    const totalColumns = maxColumn + 1;

    result.push({
      template: assignment.position.template,
      column: assignment.column,
      totalColumns,
      position: assignment.position,
    });
  }

  return result;
}

/**
 * Calculate CSS properties for a template based on its column assignment
 */
export function calculateTemplateStyles(
  assignment: ColumnAssignment
): {
  top: string;
  height: string;
  left: string;
  width: string;
} {
  const widthPercent = 100 / assignment.totalColumns;
  const leftPercent = assignment.column * widthPercent;

  return {
    top: `${assignment.position.top}px`,
    height: `${assignment.position.height}px`,
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
  };
}
