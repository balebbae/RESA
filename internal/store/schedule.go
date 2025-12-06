package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Schedule struct {
    ID           int64      `db:"id" json:"id"`
    RestaurantID int64      `db:"restaurant_id" json:"restaurant_id"`
    StartDate    DateOnly   `db:"start_date" json:"start_date"` // DateOnly auto-normalizes to YYYY-MM-DD
    EndDate      DateOnly   `db:"end_date" json:"end_date"`     // DateOnly auto-normalizes to YYYY-MM-DD
    PublishedAt  *time.Time `db:"published_at" json:"published_at,omitempty"`
    CreatedAt    time.Time  `db:"created_at" json:"created_at"`
    UpdatedAt    time.Time  `db:"updated_at" json:"updated_at"`
}

type ScheduleStore struct {
	db *sql.DB
}

func (s *ScheduleStore) Create(ctx context.Context, schedule *Schedule) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO schedules (restaurant_id, start_date, end_date, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, created_at, updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		schedule.RestaurantID,
		schedule.StartDate,
		schedule.EndDate,
	).Scan(&schedule.ID, &schedule.CreatedAt, &schedule.UpdatedAt)

	if err != nil {
		return err
	}

	return nil
}

func (s *ScheduleStore) GetByID(ctx context.Context, id int64) (*Schedule, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, start_date, end_date, published_at, created_at, updated_at
		FROM schedules
		WHERE id = $1`

	var schedule Schedule
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&schedule.ID,
		&schedule.RestaurantID,
		&schedule.StartDate,
		&schedule.EndDate,
		&schedule.PublishedAt,
		&schedule.CreatedAt,
		&schedule.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &schedule, nil
}

func (s *ScheduleStore) ListByRestaurant(ctx context.Context, restaurantID int64) ([]*Schedule, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, start_date, end_date, published_at, created_at, updated_at
		FROM schedules
		WHERE restaurant_id = $1
		ORDER BY start_date DESC`

	rows, err := s.db.QueryContext(ctx, query, restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []*Schedule

	for rows.Next() {
		var schedule Schedule
		err := rows.Scan(
			&schedule.ID,
			&schedule.RestaurantID,
			&schedule.StartDate,
			&schedule.EndDate,
			&schedule.PublishedAt,
			&schedule.CreatedAt,
			&schedule.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		schedules = append(schedules, &schedule)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return schedules, nil
}

func (s *ScheduleStore) Update(ctx context.Context, schedule *Schedule) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE schedules
		SET start_date = $1, end_date = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		schedule.StartDate,
		schedule.EndDate,
		schedule.ID,
	).Scan(&schedule.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	return nil
}

func (s *ScheduleStore) Delete(ctx context.Context, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM schedules WHERE id = $1`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (s *ScheduleStore) Publish(ctx context.Context, id int64, publishDate time.Time) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE schedules
		SET published_at = $1, updated_at = NOW()
		WHERE id = $2`

	result, err := s.db.ExecContext(ctx, query, publishDate, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}