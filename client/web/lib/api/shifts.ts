import { getApiBase } from "@/lib/api";
import { fetchWithAuth } from "@/lib/auth";
import type { ScheduledShift, CreateScheduledShiftPayload } from "@/types/schedule";

/**
 * Creates a new scheduled shift
 */
export async function createScheduledShift(
  restaurantId: number,
  scheduleId: number,
  payload: CreateScheduledShiftPayload
): Promise<ScheduledShift> {
  const response = await fetchWithAuth(
    `${getApiBase()}/restaurants/${restaurantId}/schedules/${scheduleId}/shifts`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create shift: ${errorText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Updates an existing scheduled shift
 */
export async function updateScheduledShift(
  restaurantId: number,
  scheduleId: number,
  shiftId: number,
  payload: Partial<CreateScheduledShiftPayload>
): Promise<ScheduledShift> {
  const response = await fetchWithAuth(
    `${getApiBase()}/restaurants/${restaurantId}/schedules/${scheduleId}/shifts/${shiftId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update shift: ${errorText}`);
  }

  const result = await response.json();
  return result.data;
}