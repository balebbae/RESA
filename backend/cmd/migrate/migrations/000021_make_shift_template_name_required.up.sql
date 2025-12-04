-- Backfill null/empty names with generated defaults
UPDATE shift_templates
SET name = CONCAT(
    CASE day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END,
    ' ',
    TO_CHAR(start_time, 'HH12:MI AM'),
    ' Shift'
)
WHERE name IS NULL OR TRIM(name) = '';

-- Add NOT NULL constraint
ALTER TABLE shift_templates
ALTER COLUMN name SET NOT NULL;

-- Add CHECK constraint for non-empty strings
ALTER TABLE shift_templates
ADD CONSTRAINT shift_template_name_not_empty
CHECK (TRIM(name) <> '' AND LENGTH(name) <= 255);
