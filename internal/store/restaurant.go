package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Restaurant struct {
	ID         int64     `db:"id" json:"id"`
	UserID int64     `db:"employer_id" json:"employer_id"`
	Name       string    `db:"name" json:"name"`
	Address    string    `db:"address" json:"address"`
	Phone      *string   `db:"phone" json:"phone,omitempty"` // Optional field
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time `db:"updated_at" json:"updated_at"`
	Version int `db:"version" json:"version"`
}

type RestaurantStore struct {
	db *sql.DB
}

func (s *RestaurantStore) Create(ctx context.Context, restaurant *Restaurant) error {
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
		restaurant.UserID,
		restaurant.Name,
		restaurant.Address,
		restaurant.Phone,
	).Scan(
		&restaurant.ID,
		&restaurant.CreatedAt,
		&restaurant.UpdatedAt,
	)
	if err != nil {
		return err
	}

	return nil
}

func (s *RestaurantStore) GetByID(ctx context.Context, id int64) (*Restaurant, error) {
	query := `
		SELECT 
			id, employer_id, name, address, phone, created_at, updated_at, version
		FROM 
			restaurants
		WHERE 
			id = $1
	`

	var restaurant Restaurant

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&restaurant.ID,
		&restaurant.UserID,
		&restaurant.Name,
		&restaurant.Address,
		&restaurant.Phone,
		&restaurant.CreatedAt,
		&restaurant.UpdatedAt,
		&restaurant.Version,
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

func (s *RestaurantStore) Update(ctx context.Context, restaurant *Restaurant) error { 
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
		restaurant.Name,
		restaurant.Address,
		restaurant.Phone,
		restaurant.ID,
		restaurant.Version,
	).Scan(&restaurant.Version)

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

func (s *RestaurantStore) Delete(ctx context.Context, id int64) error {
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

func (s *RestaurantStore) ListByUser(ctx context.Context, userID int64) ([]*Restaurant, error) {
	query := `
		SELECT id, employer_id, name, address, phone, created_at, updated_at, version
		FROM restaurants
		WHERE employer_id = $1
		ORDER BY id ASC
	`

	var restaurants []*Restaurant

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	
	defer rows.Close()

	for rows.Next() {
		var restaurant Restaurant
		if err := rows.Scan(&restaurant.ID, &restaurant.UserID, &restaurant.Name, &restaurant.Address, &restaurant.Phone, &restaurant.CreatedAt, &restaurant.UpdatedAt, &restaurant.Version); err != nil {
			return nil, err
		}
		restaurants = append(restaurants, &restaurant)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return restaurants, nil
}