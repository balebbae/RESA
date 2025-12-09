import type { Role } from "./role";

/**
 * Shift Template type definitions
 * Each shift template can have multiple roles
 */

export interface ShiftTemplate {
  id: number;
  restaurant_id: number;
  name: string; // Required name for the shift template
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  notes: string;
  role_ids: number[]; // IDs of roles (stored as JSONB, always present)
  created_at: string;
  updated_at: string;
}

export interface UseShiftTemplatesReturn {
  shiftTemplates: ShiftTemplate[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
