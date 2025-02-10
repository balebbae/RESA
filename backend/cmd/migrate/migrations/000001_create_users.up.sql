CREATE EXTENSION IF NOT EXISTS citext;
CREATE TYPE user_role AS ENUM ('employer', 'employee')

CREATE TABLE IF NOT EXISTS "user"(
    id bigserial PRIMARY KEY,
    email citext UNIQUE NOT NULL,
    first_name varChar(255) NOT NULL,
    last_name varChar(255) NOT NULL,
    role user_role NOT NULL
    create_at TIMESTAMP(0) with time zone NOT NULL DEFAULT NOW()
);