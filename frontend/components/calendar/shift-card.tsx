import type { ScheduledShift } from "@/types/schedule";
import { calculateShiftHeight, calculateTopOffset } from "@/lib/calendar/shift-utils";

interface ShiftCardProps {
  shift: ScheduledShift;
  onClick?: (shift: ScheduledShift) => void;
  /**
   * For handling overlapping shifts
   * width: percentage width (e.g., 50 for half width)
   * offset: percentage left offset (e.g., 50 for starting at halfway)
   */
  layoutProps?: {
    width: number;
    offset: number;
  };
}

export function ShiftCard({ shift, onClick, layoutProps }: ShiftCardProps) {
  const height = calculateShiftHeight(shift.start_time, shift.end_time);
  const topOffset = calculateTopOffset(shift.start_time);

  // Default to full width if no layout props provided
  const width = layoutProps?.width ?? 100;
  const offset = layoutProps?.offset ?? 0;

  // Get employee name or show "Unassigned"
  const displayName = shift.employee_name || "Unassigned";
  const displayRole = shift.role_name || "Role";

  // Use employee color or default gray for unassigned
  const backgroundColor = shift.employee_color || 'hsl(0, 0%, 85%)';

  // Create a darker version for the border and hover
  const borderColor = shift.employee_color
    ? shift.employee_color.replace('hsl(', 'hsla(').replace(')', ', 0.8)').replace(/(\d+)%\)/, (_, p1) => `${Math.max(0, parseInt(p1) - 15)}%)`)
    : 'hsl(0, 0%, 70%)';

  return (
    <div
      className="absolute px-2 py-1 rounded-md border-2 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] z-10"
      style={{
        height: `${height}px`,
        top: `${topOffset}px`,
        left: `${offset}%`,
        width: `${width}%`,
        backgroundColor,
        borderColor,
      }}
      onClick={() => onClick?.(shift)}
      data-shift-id={shift.id}
      data-employee-id={shift.employee_id}
      data-role-id={shift.role_id}
    >
      <div className="text-xs font-semibold truncate text-gray-900">{displayName}</div>
      {displayRole && (
        <div className="text-xs opacity-75 truncate text-gray-800">{displayRole}</div>
      )}
      <div className="text-xs opacity-70 mt-0.5 text-gray-700">
        {shift.start_time} - {shift.end_time}
      </div>
    </div>
  );
}
