"use client";

import { useRestaurant } from "@/lib/restaurant-context";
import { useEmployees } from "@/components/resa/sidebar-right/employees/hooks/use-employees";
import { WeeklyCalendar } from "@/components/resa/schedule/weekly-calendar";

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
