/* ---------- roles ---------- */
DROP TRIGGER  IF EXISTS set_role_timestamp        ON roles;
DROP FUNCTION IF EXISTS update_role_timestamp();

/* ---------- employees ---------- */
DROP TRIGGER  IF EXISTS set_employee_timestamp    ON employees;
DROP FUNCTION IF EXISTS update_employee_timestamp();

/* ---------- shift_templates ---------- */
DROP TRIGGER  IF EXISTS set_shift_template_timestamp ON shift_templates;
DROP FUNCTION IF EXISTS update_shift_template_timestamp();

/* ---------- schedules ---------- */
DROP TRIGGER  IF EXISTS set_schedule_timestamp    ON schedules;
DROP FUNCTION IF EXISTS update_schedule_timestamp();

/* ---------- scheduled_shifts ---------- */
DROP TRIGGER  IF EXISTS set_scheduled_shift_timestamp ON scheduled_shifts;
DROP FUNCTION IF EXISTS update_scheduled_shift_timestamp();