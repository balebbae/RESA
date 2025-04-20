-- Add constraint to enforce that end_time is after start_time
ALTER TABLE scheduled_shifts
ADD CONSTRAINT scheduled_shifts_times_check CHECK (end_time > start_time);

-- Add validation on foreign keys
ALTER TABLE scheduled_shifts
DROP CONSTRAINT IF EXISTS scheduled_shifts_shift_template_id_fkey,
DROP CONSTRAINT IF EXISTS scheduled_shifts_role_id_fkey,
DROP CONSTRAINT IF EXISTS scheduled_shifts_employee_id_fkey,
DROP CONSTRAINT IF EXISTS scheduled_shifts_schedule_id_fkey;

-- Re-add with proper ON DELETE actions
ALTER TABLE scheduled_shifts
ADD CONSTRAINT scheduled_shifts_shift_template_id_fkey 
FOREIGN KEY (shift_template_id) REFERENCES shift_templates(id) ON DELETE SET NULL,

ADD CONSTRAINT scheduled_shifts_role_id_fkey 
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,  

ADD CONSTRAINT scheduled_shifts_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,

ADD CONSTRAINT scheduled_shifts_schedule_id_fkey 
FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE;

-- Create an index on the shift_date for faster week-based lookups
CREATE INDEX idx_scheduled_shifts_shift_date ON scheduled_shifts(shift_date);

-- Create an index for looking up shifts by schedule
CREATE INDEX idx_scheduled_shifts_schedule_id ON scheduled_shifts(schedule_id);

-- Create an index for looking up shifts by employee
CREATE INDEX idx_scheduled_shifts_employee_id ON scheduled_shifts(employee_id); 