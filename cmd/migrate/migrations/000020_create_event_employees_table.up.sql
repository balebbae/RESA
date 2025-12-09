-- Junction table for many-to-many relationship between events and employees
CREATE TABLE IF NOT EXISTS event_employees (
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, employee_id)
);

-- Index for efficient employee lookups
CREATE INDEX idx_event_employees_employee_id ON event_employees(employee_id);
