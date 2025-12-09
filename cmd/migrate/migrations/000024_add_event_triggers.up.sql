/* =======================================================================
   events - updated_at timestamp trigger
   =======================================================================*/
CREATE OR REPLACE FUNCTION update_event_timestamp()
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
        WHERE  tgname = 'set_event_timestamp'
          AND  tgrelid = 'events'::regclass
    ) THEN
        CREATE TRIGGER set_event_timestamp
        BEFORE UPDATE ON events
        FOR EACH ROW
        EXECUTE FUNCTION update_event_timestamp();
    END IF;
END;
$$;
