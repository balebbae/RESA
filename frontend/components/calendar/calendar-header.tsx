import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateDisplay } from "@/lib/calendar/shift-utils";

interface CalendarHeaderProps {
  weekStartDate: string; // YYYY-MM-DD format (Sunday)
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function CalendarHeader({ weekStartDate, onPrevWeek, onNextWeek }: CalendarHeaderProps) {
  // Calculate week end date (Saturday)
  const weekEndDate = getWeekEndDate(weekStartDate);

  const startDisplay = formatDateDisplay(weekStartDate, "short");
  const endDisplay = formatDateDisplay(weekEndDate, "short");

  // Get year for display
  const startDate = new Date(weekStartDate + "T00:00:00");
  const year = startDate.getFullYear();

  return (
    <div className="flex items-center justify-between px-6 py-2 border-b border-border bg-background">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          {startDisplay} - {endDisplay}, {year}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Get the end date of a week (Saturday) given the start date (Sunday)
 */
function getWeekEndDate(startDate: string): string {
  const date = new Date(startDate + "T00:00:00");
  date.setDate(date.getDate() + 6);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
