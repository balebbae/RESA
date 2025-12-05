import type { ScheduledShift } from "@/types/schedule";
import { calculateShiftHeight, calculateTopOffset } from "@/lib/calendar/shift-utils";

/**
 * Darken a color by reducing its lightness if it's in HSL format,
 * otherwise darken a hex color by reducing all RGB components
 */
function darkenColor(color: string, amount: number = 20): string {
  // Try to parse as HSL
  const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) {
    const [, h, s, l] = hslMatch;
    const newLightness = Math.max(0, parseInt(l) - amount);
    return `hsl(${h}, ${s}%, ${newLightness}%)`;
  }

  // Try to parse as hex color
  const hexMatch = color.match(/^#?([0-9A-Fa-f]{6})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Reduce brightness by 20%
    const factor = 0.8;
    r = Math.max(0, Math.floor(r * factor));
    g = Math.max(0, Math.floor(g * factor));
    b = Math.max(0, Math.floor(b * factor));

    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  // Fallback to original color if format is unrecognized
  return color;
}

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

  // Use role color from shift, fallback to default blue if not available
  const backgroundColor = shift.role_color || "#A5B5D3";
  // Darken the role color for the border (reduce lightness by ~20%)
  const borderColor = shift.role_color ? darkenColor(shift.role_color) : "#8A9AB8";

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
