package store

import (
	"context"
	"database/sql"
	"errors"
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

func (s *RestStore) GetByID(ctx context.Context, id int64) (*Rest, error) {
	query := `
		SELECT 
			id, employer_id, name, address, phone, created_at, updated_at
		FROM 
			restaurants
		WHERE 
			id = $1
	`

	var restaurant Rest

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&restaurant.ID,
		&restaurant.EmployerID,
		&restaurant.Name,
		&restaurant.Address,
		&restaurant.Phone,
		&restaurant.CreatedAt,
		&restaurant.UpdatedAt,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}
	
	return &restaurant, nil
}

func (s *RestStore) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM restaurants WHERE id = $1`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	res, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return ErrNotFound
	}

	return nil
}