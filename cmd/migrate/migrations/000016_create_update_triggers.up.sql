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
