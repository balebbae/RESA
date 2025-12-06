import { getAllHours, formatHourDisplay } from "@/lib/calendar/shift-utils";

export function TimeColumn() {
  const hours = getAllHours();

  return (
    <div className="flex flex-col">
      {hours.map((hour) => (
        <div
          key={hour}
          className="h-[60px] flex items-start justify-end pr-1 text-xs bg-white text-muted-foreground"
        >
          <span className="-translate-y-1/2">{formatHourDisplay(hour)}</span>
        </div>
      ))}
    </div>
  );
}
