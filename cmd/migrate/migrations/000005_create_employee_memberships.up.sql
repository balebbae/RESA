-- 20250218_create_restaurant_employees.up.sql

CREATE TABLE employee_memberships (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_employee
        FOREIGN KEY (employee_id)
        REFERENCES users (id)
        ON DELETE CASCADE,

    CONSTRAINT uq_restaurant_employee UNIQUE (restaurant_id, employee_id)
);
