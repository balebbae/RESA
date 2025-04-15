CREATE TABLE IF NOT EXISTS scheduled_shifts (
    id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    shift_template_id INT REFERENCES shift_templates(id),
    role_id INT REFERENCES roles(id),
    employee_id INT REFERENCES employees(id),  -- Null if unassigned
    shift_date DATE NOT NULL,                  -- The specific calendar day
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
