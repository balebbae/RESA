package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"
)

type ShiftTemplate struct {
	ID           int64     `json:"id"`
	RestaurantID int64     `json:"restaurant_id"`
	Name         string    `json:"name"`
	DayOfWeek    int       `json:"day_of_week"`
	StartTime    TimeOfDay `json:"start_time"`
	EndTime      TimeOfDay `json:"end_time"`
	RoleIDs      []int64   `json:"role_ids"` // Stored as JSONB column
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ShiftTemplateStore struct {
	db *sql.DB
}

func NewShiftTemplateStore(db *sql.DB) *ShiftTemplateStore {
	return &ShiftTemplateStore{db: db}
}

func (s *ShiftTemplateStore) Create(ctx context.Context, template *ShiftTemplate) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Convert role_ids to JSON for JSONB column
	roleIDsJSON, err := json.Marshal(template.RoleIDs)
	if err != nil {
		return err
	}
	// Handle nil/empty slice -> empty JSON array
	if template.RoleIDs == nil {
		roleIDsJSON = []byte("[]")
	}

	query := `
		INSERT INTO shift_templates (restaurant_id, name, day_of_week, start_time, end_time, role_ids)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at`

	err = s.db.QueryRowContext(
		ctx,
		query,
		template.RestaurantID,
		template.Name,
		template.DayOfWeek,
		template.StartTime,
		template.EndTime,
		roleIDsJSON,
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
		SELECT id, restaurant_id, name, day_of_week, start_time, end_time, role_ids, created_at, updated_at
		FROM shift_templates
		WHERE id = $1`

	var template ShiftTemplate
	var roleIDsJSON []byte
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&template.ID,
		&template.RestaurantID,
		&template.Name,
		&template.DayOfWeek,
		&template.StartTime,
		&template.EndTime,
		&roleIDsJSON,
		&template.CreatedAt,
		&template.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	// Parse role_ids from JSONB
	if len(roleIDsJSON) > 0 {
		if err := json.Unmarshal(roleIDsJSON, &template.RoleIDs); err != nil {
			return nil, err
		}
	}
	if template.RoleIDs == nil {
		template.RoleIDs = []int64{}
	}

	return &template, nil
}

func (s *ShiftTemplateStore) ListByRestaurant(ctx context.Context, restaurantID int64) ([]*ShiftTemplate, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, name, day_of_week, start_time, end_time, role_ids, created_at, updated_at
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
		var roleIDsJSON []byte
		err := rows.Scan(
			&template.ID,
			&template.RestaurantID,
			&template.Name,
			&template.DayOfWeek,
			&template.StartTime,
			&template.EndTime,
			&roleIDsJSON,
			&template.CreatedAt,
			&template.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse role_ids from JSONB
		if len(roleIDsJSON) > 0 {
			if err := json.Unmarshal(roleIDsJSON, &template.RoleIDs); err != nil {
				return nil, err
			}
		}
		if template.RoleIDs == nil {
			template.RoleIDs = []int64{}
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

	// Convert role_ids to JSON for JSONB column
	roleIDsJSON, err := json.Marshal(template.RoleIDs)
	if err != nil {
		return err
	}
	if template.RoleIDs == nil {
		roleIDsJSON = []byte("[]")
	}

	query := `
		UPDATE shift_templates
		SET name = $1, day_of_week = $2, start_time = $3, end_time = $4, role_ids = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING updated_at`

	err = s.db.QueryRowContext(
		ctx,
		query,
		template.Name,
		template.DayOfWeek,
		template.StartTime,
		template.EndTime,
		roleIDsJSON,
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
