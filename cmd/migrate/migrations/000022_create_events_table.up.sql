-- Events table (standalone, restaurant-scoped)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (TRIM(title) <> '' AND LENGTH(title) <= 255),
    description TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure end_time is after start_time
    CONSTRAINT chk_event_time_order CHECK (end_time > start_time)
);

-- Index for efficient restaurant lookups
CREATE INDEX idx_events_restaurant_id ON events(restaurant_id);

-- Index for date-based queries (common for calendar views)
CREATE INDEX idx_events_date ON events(date);

-- Composite index for restaurant + date range queries
CREATE INDEX idx_events_restaurant_date ON events(restaurant_id, date);
