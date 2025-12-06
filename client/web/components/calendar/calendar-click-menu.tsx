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
    <div className="flex flex-col">
      <Button
        variant="ghost"
        className="justify-start h-7"
        onClick={onCreateShift}
      >
        <Plus className="h-2 w-3" />
        Create Shift
      </Button>
      <Button
        variant="ghost"
        className="justify-start h-7 opacity-50"
        onClick={onCreateEvent}
        disabled
      >
        <Calendar className="h-2 w-3" />
        Create Event
      </Button>
    </div>
  );
}
