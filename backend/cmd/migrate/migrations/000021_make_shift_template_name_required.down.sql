ALTER TABLE shift_templates
DROP CONSTRAINT IF EXISTS shift_template_name_not_empty;

ALTER TABLE shift_templates
ALTER COLUMN name DROP NOT NULL;
