package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type ShiftTemplate struct {
    ID           int64     `db:"id" json:"id"`
    RestaurantID int64     `db:"restaurant_id" json:"restaurant_id"`
    RoleID       int64     `db:"role_id" json:"role_id"`
    DayOfWeek    int       `db:"day_of_week" json:"day_of_week"` // 0=Sun ... 6=Sat
    StartTime    string    `db:"start_time" json:"start_time"`     // stored as TIME in db, use string to avoid timezone confusion in JSON
    EndTime      string    `db:"end_time" json:"end_time"`
    CreatedAt    time.Time `db:"created_at" json:"created_at"`
    UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type ShiftTemplateStore struct {
	db *sql.DB
}

func (s *ShiftTemplateStore) Create(ctx context.Context, template *ShiftTemplate) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO shift_templates (restaurant_id, role_id, day_of_week, start_time, end_time, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		template.RestaurantID,
		template.RoleID,
		template.DayOfWeek,
		template.StartTime,
		template.EndTime,
	).Scan(&template.ID, &template.CreatedAt, &template.UpdatedAt)

	if err != nil {
		return err
	}

	return nil
}

func (s *ShiftTemplateStore) GetByID(ctx context.Context, id int64) (*ShiftTemplate, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, role_id, day_of_week, start_time, end_time, created_at, updated_at
		FROM shift_templates
		WHERE id = $1`

	var template ShiftTemplate
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&template.ID,
		&template.RestaurantID,
		&template.RoleID,
		&template.DayOfWeek,
		&template.StartTime,
		&template.EndTime,
		&template.CreatedAt,
		&template.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &template, nil
}

func (s *ShiftTemplateStore) ListByRestaurant(ctx context.Context, restaurantID int64) ([]*ShiftTemplate, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, role_id, day_of_week, start_time, end_time, created_at, updated_at
		FROM shift_templates
		WHERE restaurant_id = $1
		ORDER BY day_of_week, start_time`

	rows, err := s.db.QueryContext(ctx, query, restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []*ShiftTemplate

	for rows.Next() {
		var template ShiftTemplate
		err := rows.Scan(
			&template.ID,
			&template.RestaurantID,
			&template.RoleID,
			&template.DayOfWeek,
			&template.StartTime,
			&template.EndTime,
			&template.CreatedAt,
			&template.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		templates = append(templates, &template)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return templates, nil
}

func (s *ShiftTemplateStore) Update(ctx context.Context, template *ShiftTemplate) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE shift_templates
		SET role_id = $1, day_of_week = $2, start_time = $3, end_time = $4, updated_at = NOW()
		WHERE id = $5
		RETURNING updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		template.RoleID,
		template.DayOfWeek,
		template.StartTime,
		template.EndTime,
		template.ID,
	).Scan(&template.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	return nil
}

func (s *ShiftTemplateStore) Delete(ctx context.Context, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM shift_templates WHERE id = $1`

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