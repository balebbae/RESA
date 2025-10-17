-- Remove the constraint
ALTER TABLE scheduled_shifts
DROP CONSTRAINT IF EXISTS scheduled_shifts_times_check;

-- Drop the indexes
DROP INDEX IF EXISTS idx_scheduled_shifts_shift_date;
DROP INDEX IF EXISTS idx_scheduled_shifts_schedule_id;
DROP INDEX IF EXISTS idx_scheduled_shifts_employee_id;

-- Remove the foreign key constraints with the ON DELETE clauses
ALTER TABLE scheduled_shifts
DROP CONSTRAINT IF EXISTS scheduled_shifts_shift_template_id_fkey,
DROP CONSTRAINT IF EXISTS scheduled_shifts_role_id_fkey,
DROP CONSTRAINT IF EXISTS scheduled_shifts_employee_id_fkey,
DROP CONSTRAINT IF EXISTS scheduled_shifts_schedule_id_fkey;

-- Re-add the original constraints
ALTER TABLE scheduled_shifts
ADD CONSTRAINT scheduled_shifts_shift_template_id_fkey 
FOREIGN KEY (shift_template_id) REFERENCES shift_templates(id),

ADD CONSTRAINT scheduled_shifts_role_id_fkey 
FOREIGN KEY (role_id) REFERENCES roles(id),

ADD CONSTRAINT scheduled_shifts_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(id),

ADD CONSTRAINT scheduled_shifts_schedule_id_fkey 
FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE; 