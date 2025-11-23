import { getAllHours, formatHourDisplay } from "@/lib/calendar/shift-utils";

export function TimeColumn() {
  const hours = getAllHours();

  return (
    <div className="flex flex-col">
      {hours.map((hour) => (
        <div
          key={hour}
          className="h-[40px] flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground border-b border-border"
        >
          {formatHourDisplay(hour)}
        </div>
      ))}
    </div>
  );
}
