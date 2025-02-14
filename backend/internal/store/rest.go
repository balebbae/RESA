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
	Version int `json:"version"`
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
			id, employer_id, name, address, phone, created_at, updated_at, version
		FROM 
			restaurants
		WHERE 
			id = $1
	`

	var rest Rest

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&rest.ID,
		&rest.EmployerID,
		&rest.Name,
		&rest.Address,
		&rest.Phone,
		&rest.CreatedAt,
		&rest.UpdatedAt,
		&rest.Version,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}
	
	return &rest, nil
}

func (s *RestStore) Update(ctx context.Context, rest *Rest) error { 
	query := `
		UPDATE restaurants
		SET 
			name = $1, 
			address = $2, 
			phone = $3,
			version = version + 1
		WHERE id = $4 AND version = $5
		RETURNING version
	`
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(
		ctx,
		query,
		rest.Name,
		rest.Address,
		rest.Phone,
		rest.ID,
		rest.Version,
	).Scan(&rest.Version)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return ErrNotFound
		default:
			return err
		}
	}

	return nil
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