export interface Schedule {
  id: number;
  restaurant_id: number;
  start_date: string; // YYYY-MM-DD format
  end_date: string;   // YYYY-MM-DD format
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledShift {
  id: number;
  schedule_id: number;
  shift_template_id: number | null;
  role_id: number;
  employee_id: number | null;
  shift_date: string; // YYYY-MM-DD format
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  notes: string;
  created_at: string;
  updated_at: string;
  // Populated fields from joins
  employee_name?: string;
  role_name?: string;
  role_color?: string;
  employee_color?: string; // Employee's unique pastel color
}

// API payload types
export interface CreateSchedulePayload {
  start_date: string; // YYYY-MM-DD format
  end_date: string;   // YYYY-MM-DD format
}

export interface CreateScheduledShiftPayload {
  shift_template_id?: number | null;
  role_id: number;
  employee_id?: number | null;
  shift_date: string; // ISO 8601: YYYY-MM-DDTHH:MM:SSZ
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  notes?: string;
}
