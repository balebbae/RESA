CREATE TABLE IF NOT EXISTS employee_roles (
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (employee_id, role_id)
);
