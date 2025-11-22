import { useDroppable } from "@dnd-kit/core";
import type { ScheduledShift, TimeSlotDropData } from "@/types/schedule";
import type { ShiftTemplate } from "@/types/shift-template";
import type { Role } from "@/types/role";
import { ShiftCard } from "@/components/calendar/shift-card";
import { addOpacityToHsl, getRoleColor } from "@/components/resa/schedule/utils/role-colors";
import { parseTimeToHour } from "@/components/resa/schedule/utils/time-utils";

interface TimeSlotCellProps {
  date: string; // YYYY-MM-DD format
  hour: number; // 0-23
  shifts: ScheduledShift[]; // All shifts for this specific day/hour
  onShiftClick?: (shift: ScheduledShift) => void;
  shiftTemplates: ShiftTemplate[];
  roles: Role[];
  roleColorMap: Map<number, string>;
}

export function TimeSlotCell({
  date,
  hour,
  shifts,
  onShiftClick,
  shiftTemplates,
  roles,
  roleColorMap
}: TimeSlotCellProps) {
  // Make this cell droppable
  const dropData: TimeSlotDropData = {
    type: 'timeslot',
    date,
    hour,
  };

  const { isOver, setNodeRef } = useDroppable({
    id: `timeslot-${date}-${hour}`,
    data: dropData,
  });

  // Get day of week for this date (0 = Sunday, 6 = Saturday)
  const dayOfWeek = new Date(date + "T00:00:00").getDay();

  // Filter shift templates that match this day and hour
  const templatesInSlot = shiftTemplates.filter((template) => {
    if (template.day_of_week !== dayOfWeek) return false;

    const startHour = parseTimeToHour(template.start_time);
    const endHour = parseTimeToHour(template.end_time);

    return hour >= startHour && hour < endHour;
  });

  // Filter shifts that start in this hour slot
  const shiftsInSlot = shifts.filter((shift) => {
    const shiftHour = Math.floor(parseFloat(shift.start_time.split(":")[0]));
    return shift.shift_date === date && shiftHour === hour;
  });

  // Calculate layout for overlapping shifts
  const shiftCount = shiftsInSlot.length;
  const shiftLayouts = shiftsInSlot.map((_, index) => ({
    width: shiftCount > 1 ? 100 / shiftCount : 100,
    offset: shiftCount > 1 ? (100 / shiftCount) * index : 0,
  }));

  return (
    <div
      ref={setNodeRef}
      className={`relative h-[40px] border-b border-r border-border transition-colors ${
        isOver ? 'bg-blue-50 dark:bg-blue-950' : 'bg-background'
      }`}
      data-day={date}
      data-hour={hour}
    >
      {/* Render shift template backgrounds (lowest z-index) */}
      {templatesInSlot.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-[1] flex">
          {templatesInSlot.map((template, index) => {
            // Use first role's color if available, otherwise use a default
            const firstRoleId = template.roles?.[0]?.id;
            const roleColor = firstRoleId ? getRoleColor(firstRoleId, roleColorMap) : 'hsl(0, 0%, 50%)';
            const backgroundColor = addOpacityToHsl(roleColor, 0.3);
            const isNotLast = index < templatesInSlot.length - 1;

            return (
              <div
                key={template.id}
                className={`h-full flex-1 ${isNotLast ? 'border-r border-gray-400/30' : ''}`}
                style={{
                  backgroundColor,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Render actual shifts (higher z-index) */}
      {shiftsInSlot.map((shift, index) => (
        <ShiftCard
          key={shift.id}
          shift={shift}
          onClick={onShiftClick}
          layoutProps={shiftLayouts[index]}
        />
      ))}
    </div>
  );
}
