CREATE TABLE IF NOT EXISTS scheduled_shifts (
    id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    shift_template_id INT REFERENCES shift_templates(id) ON DELETE SET NULL,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    employee_id INT REFERENCES employees(id) ON DELETE SET NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT DEFAULT '',
    -- Denormalized fields (synced via triggers in 000015)
    employee_name VARCHAR(255),
    role_name VARCHAR(100) NOT NULL,
    role_color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT scheduled_shifts_times_check CHECK (end_time > start_time)
);

-- Optimized indexes for common query patterns
CREATE INDEX idx_scheduled_shifts_restaurant_date ON scheduled_shifts(restaurant_id, shift_date);
CREATE INDEX idx_scheduled_shifts_schedule_id ON scheduled_shifts(schedule_id);
CREATE INDEX idx_scheduled_shifts_employee_id ON scheduled_shifts(employee_id);
CREATE INDEX idx_scheduled_shifts_shift_date ON scheduled_shifts(shift_date);
