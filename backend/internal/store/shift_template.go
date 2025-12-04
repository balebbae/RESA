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
    Name         string    `db:"name" json:"name"` // required name like "Morning Shift"
    DayOfWeek    int       `db:"day_of_week" json:"day_of_week"` // 0=Sun ... 6=Sat
    StartTime    string    `db:"start_time" json:"start_time"`     // stored as TIME in db, use string to avoid timezone confusion in JSON
    EndTime      string    `db:"end_time" json:"end_time"`
    CreatedAt    time.Time `db:"created_at" json:"created_at"`
    UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`

    // Joined field (populated when fetching with roles)
    Roles        []int64   `json:"role_ids,omitempty"`
}

type ShiftTemplateStore struct {
	db *sql.DB
}

// normalizeTimeString converts various time formats to HH:MM:SS format
// Handles: "HH:MM:SS", "HH:MM", "0000-01-01THH:MM:SSZ", time.Time, etc.
// This is needed because PostgreSQL TIME columns are scanned as RFC3339 timestamps
// (e.g., "0000-01-01T02:00:00Z") by the pq driver, but PostgreSQL expects "HH:MM:SS" format for inserts
func normalizeTimeString(timeStr string) string {
	// If already in HH:MM:SS or HH:MM format, return as-is
	if len(timeStr) == 8 && timeStr[2] == ':' && timeStr[5] == ':' {
		return timeStr // HH:MM:SS
	}
	if len(timeStr) == 5 && timeStr[2] == ':' {
		return timeStr + ":00" // HH:MM -> HH:MM:00
	}

	// Try parsing as RFC3339/ISO8601 timestamp (what PostgreSQL TIME returns)
	if t, err := time.Parse(time.RFC3339, timeStr); err == nil {
		return t.Format("15:04:05")
	}

	// Try other common time formats
	formats := []string{
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05",
		"15:04:05",
		"15:04",
	}
	for _, format := range formats {
		if t, err := time.Parse(format, timeStr); err == nil {
			return t.Format("15:04:05")
		}
	}

	// If all parsing fails, return as-is (will likely cause DB error but won't panic)
	return timeStr
}

func (s *ShiftTemplateStore) Create(ctx context.Context, template *ShiftTemplate) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO shift_templates (restaurant_id, name, day_of_week, start_time, end_time, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at`

	err := s.db.QueryRowContext(
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

	// Normalize time formats
	template.StartTime = normalizeTimeString(template.StartTime)
	template.EndTime = normalizeTimeString(template.EndTime)

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

		// Normalize time formats to ensure PostgreSQL compatibility
		template.StartTime = normalizeTimeString(template.StartTime)
		template.EndTime = normalizeTimeString(template.EndTime)

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

// AssignRoles replaces all role associations for a shift template
// Uses a transaction to ensure atomicity (delete + insert together)
func (s *ShiftTemplateStore) AssignRoles(ctx context.Context, templateID int64, roleIDs []int64) error {
	return withTx(s.db, ctx, func(tx *sql.Tx) error {
		ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
		defer cancel()

		// Delete existing associations
		deleteQuery := `DELETE FROM shift_template_roles WHERE shift_template_id = $1`
		_, err := tx.ExecContext(ctx, deleteQuery, templateID)
		if err != nil {
			return err
		}

		// Insert new associations
		if len(roleIDs) > 0 {
			insertQuery := `
				INSERT INTO shift_template_roles (shift_template_id, role_id)
				VALUES ($1, $2)`

			stmt, err := tx.PrepareContext(ctx, insertQuery)
			if err != nil {
				return err
			}
			defer stmt.Close()

			for _, roleID := range roleIDs {
				_, err = stmt.ExecContext(ctx, templateID, roleID)
				if err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// GetRoles retrieves role IDs for a shift template
func (s *ShiftTemplateStore) GetRoles(ctx context.Context, templateID int64) ([]int64, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT role_id
		FROM shift_template_roles
		WHERE shift_template_id = $1
		ORDER BY role_id`

	rows, err := s.db.QueryContext(ctx, query, templateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roleIDs []int64
	for rows.Next() {
		var roleID int64
		if err := rows.Scan(&roleID); err != nil {
			return nil, err
		}
		roleIDs = append(roleIDs, roleID)
	}

	return roleIDs, rows.Err()
}

// GetRolesDetailed retrieves full Role objects for a shift template
func (s *ShiftTemplateStore) GetRolesDetailed(ctx context.Context, templateID int64) ([]*Role, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT r.id, r.restaurant_id, r.name, r.color, r.created_at, r.updated_at
		FROM roles r
		INNER JOIN shift_template_roles str ON r.id = str.role_id
		WHERE str.shift_template_id = $1
		ORDER BY r.name`

	rows, err := s.db.QueryContext(ctx, query, templateID)
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
			&role.Color,
			&role.CreatedAt,
			&role.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		roles = append(roles, &role)
	}

	return roles, rows.Err()
}

// ListByRestaurantWithRoles lists all shift templates for a restaurant with their role IDs populated
func (s *ShiftTemplateStore) ListByRestaurantWithRoles(ctx context.Context, restaurantID int64) ([]*ShiftTemplate, error) {
	// First get all templates
	templates, err := s.ListByRestaurant(ctx, restaurantID)
	if err != nil {
		return nil, err
	}

	// For each template, fetch role IDs
	for _, template := range templates {
		roleIDs, err := s.GetRoles(ctx, template.ID)
		if err != nil {
			return nil, err
		}
		template.Roles = roleIDs
	}

	return templates, nil
}