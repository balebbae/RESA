-- Drop the old shift_templates table (fresh start as requested)
DROP TABLE IF EXISTS shift_templates CASCADE;

-- Recreate shift_templates with name field and without role_id
CREATE TABLE IF NOT EXISTS shift_templates (
    id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NULL,
    -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create junction table for shift_templates <-> roles (many-to-many)
CREATE TABLE IF NOT EXISTS shift_template_roles (
    shift_template_id INT NOT NULL REFERENCES shift_templates(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (shift_template_id, role_id)
);
