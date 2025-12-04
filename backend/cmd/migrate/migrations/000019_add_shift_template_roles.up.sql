-- Junction table for shift template to role many-to-many relationship
-- This allows shift templates to have multiple associated roles
-- When calendar loads, scheduled shifts will be auto-created for each role

CREATE TABLE IF NOT EXISTS shift_template_roles (
    shift_template_id INT NOT NULL REFERENCES shift_templates(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (shift_template_id, role_id)
);

-- Index for faster lookups by template (when fetching roles for a template)
CREATE INDEX idx_shift_template_roles_template ON shift_template_roles(shift_template_id);

-- Index for faster lookups by role (when checking which templates use a role)
CREATE INDEX idx_shift_template_roles_role ON shift_template_roles(role_id);
