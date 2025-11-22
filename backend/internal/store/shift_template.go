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
    Name         *string   `db:"name" json:"name,omitempty"` // optional name like "Morning Shift"
    DayOfWeek    int       `db:"day_of_week" json:"day_of_week"` // 0=Sun ... 6=Sat
    StartTime    string    `db:"start_time" json:"start_time"`     // stored as TIME in db, use string to avoid timezone confusion in JSON
    EndTime      string    `db:"end_time" json:"end_time"`
    CreatedAt    time.Time `db:"created_at" json:"created_at"`
    UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type ShiftTemplateStore struct {
	db *sql.DB
}

func (s *ShiftTemplateStore) Create(ctx context.Context, template *ShiftTemplate, roleIDs []int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Start a transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert the shift template
	query := `
		INSERT INTO shift_templates (restaurant_id, name, day_of_week, start_time, end_time, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at`

	err = tx.QueryRowContext(
		ctx,
		query,
		template.RestaurantID,
		template.Name,
		template.DayOfWeek,
		template.StartTime,
		template.EndTime,
	).Scan(&template.ID, &template.CreatedAt, &template.UpdatedAt)

	if err != nil {
		return err
	}

	// Insert role assignments
	for _, roleID := range roleIDs {
		insertQuery := `
			INSERT INTO shift_template_roles (shift_template_id, role_id)
			VALUES ($1, $2)`

		_, err = tx.ExecContext(ctx, insertQuery, template.ID, roleID)
		if err != nil {
			return err
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

func (s *ShiftTemplateStore) GetByID(ctx context.Context, id int64) (*ShiftTemplate, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, name, day_of_week, start_time, end_time, created_at, updated_at
		FROM shift_templates
		WHERE id = $1`

	var template ShiftTemplate
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&template.ID,
		&template.RestaurantID,
		&template.Name,
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
		SELECT id, restaurant_id, name, day_of_week, start_time, end_time, created_at, updated_at
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
			&template.Name,
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
		SET name = $1, day_of_week = $2, start_time = $3, end_time = $4, updated_at = NOW()
		WHERE id = $5
		RETURNING updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		template.Name,
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

// AssignRoles assigns multiple roles to a shift template
func (s *ShiftTemplateStore) AssignRoles(ctx context.Context, shiftTemplateID int64, roleIDs []int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Start a transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert each role assignment
	for _, roleID := range roleIDs {
		// First check if this assignment already exists
		var exists bool
		checkQuery := `
			SELECT EXISTS (
				SELECT 1
				FROM shift_template_roles
				WHERE shift_template_id = $1 AND role_id = $2
			)`

		err := tx.QueryRowContext(ctx, checkQuery, shiftTemplateID, roleID).Scan(&exists)
		if err != nil {
			return err
		}

		if exists {
			continue // Skip if already assigned
		}

		// Insert the new role assignment
		insertQuery := `
			INSERT INTO shift_template_roles (shift_template_id, role_id)
			VALUES ($1, $2)`

		_, err = tx.ExecContext(ctx, insertQuery, shiftTemplateID, roleID)
		if err != nil {
			return err
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

// RemoveRole removes a single role from a shift template
func (s *ShiftTemplateStore) RemoveRole(ctx context.Context, shiftTemplateID int64, roleID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		DELETE FROM shift_template_roles
		WHERE shift_template_id = $1 AND role_id = $2`

	result, err := s.db.ExecContext(ctx, query, shiftTemplateID, roleID)
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

// GetRoles retrieves all roles assigned to a shift template
func (s *ShiftTemplateStore) GetRoles(ctx context.Context, shiftTemplateID, restaurantID int64) ([]*Role, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT r.id, r.restaurant_id, r.name, r.created_at, r.updated_at
		FROM roles r
		INNER JOIN shift_template_roles str ON r.id = str.role_id
		WHERE str.shift_template_id = $1
		  AND r.restaurant_id = $2
		ORDER BY r.name ASC`

	rows, err := s.db.QueryContext(ctx, query, shiftTemplateID, restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []*Role
	for rows.Next() {
		var role Role
		err := rows.Scan(
			&role.ID,
			&role.RestaurantID,
			&role.Name,
			&role.CreatedAt,
			&role.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		roles = append(roles, &role)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return roles, nil
}