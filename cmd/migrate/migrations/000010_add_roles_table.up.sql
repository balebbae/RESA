CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    level INT NOT NULL DEFAULT 0,
    description TEXT
);

INSERT INTO roles (name, description, level)
VALUES (
    'employee',
    'An employee can view work schedule and edit their availability',
    1
);

INSERT INTO roles (name, description, level)
VALUES (
    'employer',
    'An employer can create, edit, delete their restaurant',
    2
);