CREATE TABLE IF NOT EXISTS restaurants (
    id BIGSERIAL PRIMARY KEY,
    employer_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT, 
    created_at TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW(), 
    updated_at TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION update_restaurant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_restaurant_timestamp
BEFORE UPDATE ON restaurants
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_timestamp();
