package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Shift struct {
	ID int64 `json:"id"`
	RestaurantID int64 `json:"restaurant_id"`
	StartTime time.Time `json:"start_time"`
	EndTime time.Time `json:"end_time"`
	Positions int64 `json:"position"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ShiftStore struct {
	db *sql.DB
}

func (s *ShiftStore) Create(ctx context.Context, shift *Shift) error {
	query := `
		INSERT INTO shifts (restaurant_id, start_time, end_time, positions)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at;
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s. db.QueryRowContext(
		ctx,
		query,
		shift.RestaurantID,
		shift.StartTime,
		shift.EndTime,
		shift.Positions,
	).Scan(
		&shift.ID,
		&shift.CreatedAt,
		&shift.UpdatedAt,
	)

	if err != nil {
		return err
	}

	return nil
}

func(s *ShiftStore) GetByID(ctx context.Context, id int64) (*Shift, error) {
	query := `
		SELECT
			id, restaurant_id, start_time, end_time, positions, created_at, updated_at
		FROM
			shifts
		WHERE 
			id = $1
	`

	var shift Shift

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&shift.ID,
		&shift.RestaurantID,
		&shift.StartTime,
		&shift.EndTime,
		&shift.Positions,
		&shift.CreatedAt,
		&shift.UpdatedAt,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}

	return &shift, nil
}

func(s *ShiftStore) GetByRestaurantID(ctx context.Context, id int64) ([]Shift, error) {
	query := `
		SELECT 
			id,
			restaurant_id,
			start_time,
			end_time,
			positions,
			created_at,
			updated_at
		FROM shifts
		WHERE restaurant_id = $1
		ORDER BY start_time ASC
	`

	
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()
	
	
	rows, err := s.db.QueryContext(ctx, query, id)
	if err != nil {
		return nil, err
	}
	
	var shifts []Shift

	for rows.Next() {
		var shift Shift
		if err := rows.Scan(
			&shift.ID,
			&shift.RestaurantID,
			&shift.StartTime,
			&shift.EndTime,
			&shift.Positions,
			&shift.CreatedAt,
			&shift.UpdatedAt,
		); err != nil {
			return nil, err
		}
		shifts = append(shifts, shift)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return shifts, nil
}