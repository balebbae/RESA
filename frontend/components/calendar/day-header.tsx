import { getDayName, formatDateDisplay } from "@/components/resa/schedule/utils/shift-utils";

interface DayHeaderProps {
  date: string; // YYYY-MM-DD format
  dayIndex: number; // 0-6 (Sunday-Saturday)
}

export function DayHeader({ date, dayIndex }: DayHeaderProps) {
  const dayName = getDayName(dayIndex);
  const dateDisplay = formatDateDisplay(date, "short");

  // Check if this is today
  const today = new Date();
  const dateObj = new Date(date + "T00:00:00");
  const isToday =
    today.getFullYear() === dateObj.getFullYear() &&
    today.getMonth() === dateObj.getMonth() &&
    today.getDate() === dateObj.getDate();

  return (
    <div className="h-[40px] flex flex-col items-center justify-center border-b border-r border-border bg-sidebar">
      <div
        className={`text-xs font-medium ${
          isToday ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {dayName}
      </div>
      <div
        className={`text-sm font-semibold ${
          isToday
            ? "text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center"
            : ""
        }`}
      >
        {dateObj.getDate()}
      </div>
    </div>
  );
}
