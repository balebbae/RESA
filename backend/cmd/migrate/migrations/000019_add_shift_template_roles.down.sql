-- Rollback migration for shift_template_roles junction table
-- This removes the many-to-many relationship between shift templates and roles

DROP TABLE IF EXISTS shift_template_roles;
