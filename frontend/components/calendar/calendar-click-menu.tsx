"use client";

import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarClickMenuProps {
  onCreateShift: () => void;
  onCreateEvent: () => void;
}

/**
 * Menu shown when clicking on an empty area of the calendar.
 * Provides options to create a shift or event at the clicked position.
 */
export function CalendarClickMenu({
  onCreateShift,
  onCreateEvent,
}: CalendarClickMenuProps) {
  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="ghost"
        className="justify-start h-9"
        onClick={onCreateShift}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Shift
      </Button>
      <Button
        variant="ghost"
        className="justify-start h-9 opacity-50"
        onClick={onCreateEvent}
        disabled
      >
        <Calendar className="h-4 w-4 mr-2" />
        Create Event
      </Button>
    </div>
  );
}
