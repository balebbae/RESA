import { getApiBase } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";
import type { Schedule, CreateSchedulePayload } from "@/types/schedule";

/**
 * Creates a new schedule for a restaurant
 */
export async function createSchedule(
  restaurantId: number,
  payload: CreateSchedulePayload
): Promise<Schedule> {
  const response = await fetchWithAuth(
    `${getApiBase()}/restaurants/${restaurantId}/schedules`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create schedule: ${errorText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Publishes a schedule (sets published_at timestamp)
 */
export async function publishSchedule(
  restaurantId: number,
  scheduleId: number
): Promise<void> {
  const response = await fetchWithAuth(
    `${getApiBase()}/restaurants/${restaurantId}/schedules/${scheduleId}/publish`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to publish schedule: ${errorText}`);
  }
}
