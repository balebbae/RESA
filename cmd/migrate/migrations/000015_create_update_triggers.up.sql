/* =======================================================================
   roles
   =======================================================================*/
CREATE OR REPLACE FUNCTION update_role_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_trigger
        WHERE  tgname = 'set_role_timestamp'
          AND  tgrelid = 'roles'::regclass
    ) THEN
        CREATE TRIGGER set_role_timestamp
        BEFORE UPDATE ON roles
        FOR EACH ROW
        EXECUTE FUNCTION update_role_timestamp();
    END IF;
END;
$$;


/* =======================================================================
   employees
   =======================================================================*/
CREATE OR REPLACE FUNCTION update_employee_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_trigger
        WHERE  tgname = 'set_employee_timestamp'
          AND  tgrelid = 'employees'::regclass
    ) THEN
        CREATE TRIGGER set_employee_timestamp
        BEFORE UPDATE ON employees
        FOR EACH ROW
        EXECUTE FUNCTION update_employee_timestamp();
    END IF;
END;
$$;


/* =======================================================================
   shift_templates
   =======================================================================*/
CREATE OR REPLACE FUNCTION update_shift_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_trigger
        WHERE  tgname = 'set_shift_template_timestamp'
          AND  tgrelid = 'shift_templates'::regclass
    ) THEN
        CREATE TRIGGER set_shift_template_timestamp
        BEFORE UPDATE ON shift_templates
        FOR EACH ROW
        EXECUTE FUNCTION update_shift_template_timestamp();
    END IF;
END;
$$;


/* =======================================================================
   schedules
   =======================================================================*/
CREATE OR REPLACE FUNCTION update_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_trigger
        WHERE  tgname = 'set_schedule_timestamp'
          AND  tgrelid = 'schedules'::regclass
    ) THEN
        CREATE TRIGGER set_schedule_timestamp
        BEFORE UPDATE ON schedules
        FOR EACH ROW
        EXECUTE FUNCTION update_schedule_timestamp();
    END IF;
END;
$$;


/* =======================================================================
   scheduled_shifts
   =======================================================================*/
CREATE OR REPLACE FUNCTION update_scheduled_shift_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_trigger
        WHERE  tgname = 'set_scheduled_shift_timestamp'
          AND  tgrelid = 'scheduled_shifts'::regclass
    ) THEN
        CREATE TRIGGER set_scheduled_shift_timestamp
        BEFORE UPDATE ON scheduled_shifts
        FOR EACH ROW
        EXECUTE FUNCTION update_scheduled_shift_timestamp();
    END IF;
END;
$$;


/* =======================================================================
   DENORMALIZATION SYNC TRIGGERS
   These triggers keep denormalized fields in scheduled_shifts in sync
   with their source tables (employees, roles)
   =======================================================================*/

-- Sync employee name changes to scheduled_shifts
CREATE OR REPLACE FUNCTION sync_employee_name_to_shifts()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
        UPDATE scheduled_shifts
        SET employee_name = NEW.full_name
        WHERE employee_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_employee_name
AFTER UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION sync_employee_name_to_shifts();

-- Sync role name/color changes to scheduled_shifts
CREATE OR REPLACE FUNCTION sync_role_to_shifts()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.name IS DISTINCT FROM NEW.name OR OLD.color IS DISTINCT FROM NEW.color THEN
        UPDATE scheduled_shifts
        SET role_name = NEW.name, role_color = NEW.color
        WHERE role_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_role_to_shifts
AFTER UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION sync_role_to_shifts();

-- Clear employee_name when employee is deleted
CREATE OR REPLACE FUNCTION clear_deleted_employee_name()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE scheduled_shifts
    SET employee_name = NULL
    WHERE employee_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clear_employee_on_delete
BEFORE DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION clear_deleted_employee_name();

-- Remove deleted role from shift_templates.role_ids
CREATE OR REPLACE FUNCTION remove_deleted_role_from_templates()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shift_templates
    SET role_ids = role_ids - OLD.id::text::jsonb
    WHERE role_ids ? OLD.id::text;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_remove_role_from_templates
BEFORE DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION remove_deleted_role_from_templates();
