CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,   -- e.g., the Monday of the schedule
    end_date DATE NOT NULL,     -- e.g., the Sunday of the schedule
    published_at TIMESTAMPTZ,   -- null if not yet “sent out”
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
