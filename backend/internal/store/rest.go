package store

import (
	"context"
	"database/sql"
	"time"
)

type Rest struct {
	ID         int64     `json:"id"`
	EmployerID int64     `json:"employer_id"`
	Name       string    `json:"name"`
	Address    string    `json:"address"`
	Phone      *string   `json:"phone,omitempty"` // Optional field
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type RestStore struct {
	db *sql.DB
}

func (s *RestStore) Create(ctx context.Context, rest *Rest) error {
	query := `
		INSERT INTO restaurants (employer_id, name, address, phone) 
		VALUES ($1, $2, $3, $4) 
		RETURNING id, created_at, updated_at;
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(
		ctx, 
		query,
		rest.EmployerID,
		rest.Name,
		rest.Address,
		rest.Phone,
	).Scan(
		&rest.ID,
		&rest.CreatedAt,
		&rest.UpdatedAt,
	)
	if err != nil {
		return err
	}

	return nil
}