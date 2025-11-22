"use client";

import { useRestaurant } from "@/contexts/restaurant-context";
import { useEmployees } from "@/hooks/use-employees";
import { WeeklyCalendar } from "@/components/calendar/calendar-week-view";

export default function Page() {
  const { selectedRestaurantId } = useRestaurant();
  const { employees } = useEmployees(selectedRestaurantId);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <WeeklyCalendar
        restaurantId={selectedRestaurantId}
        employees={employees}
      />
    </div>
  );
}
