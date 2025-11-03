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

// Drag and drop data types
export interface EmployeeDragData {
  type: 'employee';
  employeeId: number;
  employeeName: string;
  employeeColor: string;
}

export interface TimeSlotDropData {
  type: 'timeslot';
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
}
