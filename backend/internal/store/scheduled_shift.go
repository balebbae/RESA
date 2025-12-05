package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

var (
	ErrForbidden = errors.New("forbidden operation")
)

type ScheduledShift struct {
	ID              int64     `json:"id"`
	ScheduleID      int64     `json:"schedule_id"`
	ShiftTemplateID *int64    `json:"shift_template_id,omitempty"`
	RoleID          int64     `json:"role_id"`
	EmployeeID      *int64    `json:"employee_id,omitempty"`
	ShiftDate       time.Time `json:"shift_date"`        // date only
	StartTime       TimeOfDay `json:"start_time"`        // TimeOfDay auto-normalizes pq driver RFC3339 format
	EndTime         TimeOfDay `json:"end_time"`          // TimeOfDay auto-normalizes pq driver RFC3339 format
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	// Joined fields (not stored in scheduled_shifts table)
	EmployeeName    *string   `json:"employee_name,omitempty"`
	RoleName        string    `json:"role_name"`
}

type ScheduledShiftStore struct {
	db *sql.DB
}

func NewScheduledShiftStore(db *sql.DB) *ScheduledShiftStore {
	return &ScheduledShiftStore{db: db}
}

// Create inserts a new scheduled shift
func (s *ScheduledShiftStore) Create(ctx context.Context, shift *ScheduledShift) error {
	return withTx(s.db, ctx, func(tx *sql.Tx) error {
		ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
		defer cancel()

		query := `
			INSERT INTO scheduled_shifts (
				schedule_id, shift_template_id, role_id, employee_id, 
				shift_date, start_time, end_time, notes
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id, created_at, updated_at`

		err := tx.QueryRowContext(
			ctx,
			query,
			shift.ScheduleID,
			shift.ShiftTemplateID,
			shift.RoleID,
			shift.EmployeeID,
			shift.ShiftDate,
			shift.StartTime,
			shift.EndTime,
			shift.Notes,
		).Scan(&shift.ID, &shift.CreatedAt, &shift.UpdatedAt)

		if err != nil {
			return err
		}

		return nil
	})
}

// BatchCreate inserts multiple scheduled shifts in one transaction
func (s *ScheduledShiftStore) BatchCreate(ctx context.Context, shifts []*ScheduledShift) ([]int64, error) {
	var createdIDs []int64

	err := withTx(s.db, ctx, func(tx *sql.Tx) error {
		ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
		defer cancel()

		query := `
			INSERT INTO scheduled_shifts (
				schedule_id, shift_template_id, role_id, employee_id, 
				shift_date, start_time, end_time, notes
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id, created_at, updated_at`

		stmt, err := tx.PrepareContext(ctx, query)
		if err != nil {
			return err
		}
		defer stmt.Close()

		for _, shift := range shifts {
			err = stmt.QueryRowContext(
				ctx,
				shift.ScheduleID,
				shift.ShiftTemplateID,
				shift.RoleID,
				shift.EmployeeID,
				shift.ShiftDate,
				shift.StartTime,
				shift.EndTime,
				shift.Notes,
			).Scan(&shift.ID, &shift.CreatedAt, &shift.UpdatedAt)

			if err != nil {
				return err
			}
			
			createdIDs = append(createdIDs, shift.ID)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return createdIDs, nil
}

// GetByID retrieves a scheduled shift by its ID
func (s *ScheduledShiftStore) GetByID(ctx context.Context, id int64) (*ScheduledShift, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT
			ss.id, ss.schedule_id, ss.shift_template_id, ss.role_id, ss.employee_id,
			ss.shift_date, ss.start_time, ss.end_time, ss.notes, ss.created_at, ss.updated_at,
			e.full_name as employee_name,
			r.name as role_name
		FROM scheduled_shifts ss
		LEFT JOIN employees e ON ss.employee_id = e.id
		INNER JOIN roles r ON ss.role_id = r.id
		WHERE ss.id = $1`

	var shift ScheduledShift
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&shift.ID,
		&shift.ScheduleID,
		&shift.ShiftTemplateID,
		&shift.RoleID,
		&shift.EmployeeID,
		&shift.ShiftDate,
		&shift.StartTime,
		&shift.EndTime,
		&shift.Notes,
		&shift.CreatedAt,
		&shift.UpdatedAt,
		&shift.EmployeeName,
		&shift.RoleName,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	// TimeOfDay.Scan() automatically normalizes time formats

	return &shift, nil
}

// ListBySchedule retrieves all scheduled shifts for a specific schedule
func (s *ScheduledShiftStore) ListBySchedule(ctx context.Context, scheduleID int64) ([]*ScheduledShift, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT
			ss.id, ss.schedule_id, ss.shift_template_id, ss.role_id, ss.employee_id,
			ss.shift_date, ss.start_time, ss.end_time, ss.notes, ss.created_at, ss.updated_at,
			e.full_name as employee_name,
			r.name as role_name
		FROM scheduled_shifts ss
		LEFT JOIN employees e ON ss.employee_id = e.id
		INNER JOIN roles r ON ss.role_id = r.id
		WHERE ss.schedule_id = $1
		ORDER BY ss.shift_date, ss.start_time`

	rows, err := s.db.QueryContext(ctx, query, scheduleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shifts []*ScheduledShift
	for rows.Next() {
		var shift ScheduledShift
		err := rows.Scan(
			&shift.ID,
			&shift.ScheduleID,
			&shift.ShiftTemplateID,
			&shift.RoleID,
			&shift.EmployeeID,
			&shift.ShiftDate,
			&shift.StartTime,
			&shift.EndTime,
			&shift.Notes,
			&shift.CreatedAt,
			&shift.UpdatedAt,
			&shift.EmployeeName,
			&shift.RoleName,
		)
		if err != nil {
			return nil, err
		}

		// TimeOfDay.Scan() automatically normalizes time formats

		shifts = append(shifts, &shift)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return shifts, nil
}

// ListByRestaurantAndWeek retrieves all scheduled shifts for a restaurant within a date range
func (s *ScheduledShiftStore) ListByRestaurantAndWeek(ctx context.Context, restaurantID int64, weekStart, weekEnd time.Time) ([]*ScheduledShift, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT ss.id, ss.schedule_id, ss.shift_template_id, ss.role_id, ss.employee_id, 
		       ss.shift_date, ss.start_time, ss.end_time, ss.notes, ss.created_at, ss.updated_at
		FROM scheduled_shifts ss
		JOIN schedules sc ON ss.schedule_id = sc.id
		WHERE sc.restaurant_id = $1 
		  AND ss.shift_date BETWEEN $2 AND $3
		ORDER BY ss.shift_date, ss.start_time`

	rows, err := s.db.QueryContext(ctx, query, restaurantID, weekStart, weekEnd)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shifts []*ScheduledShift
	for rows.Next() {
		var shift ScheduledShift
		err := rows.Scan(
			&shift.ID,
			&shift.ScheduleID,
			&shift.ShiftTemplateID,
			&shift.RoleID,
			&shift.EmployeeID,
			&shift.ShiftDate,
			&shift.StartTime,
			&shift.EndTime,
			&shift.Notes,
			&shift.CreatedAt,
			&shift.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// TimeOfDay.Scan() automatically normalizes time formats

		shifts = append(shifts, &shift)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return shifts, nil
}

// Update updates a scheduled shift's information
func (s *ScheduledShiftStore) Update(ctx context.Context, shift *ScheduledShift) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE scheduled_shifts
		SET shift_template_id = $1, role_id = $2, employee_id = $3, 
		    shift_date = $4, start_time = $5, end_time = $6, notes = $7, updated_at = NOW()
		WHERE id = $8
		RETURNING updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		shift.ShiftTemplateID,
		shift.RoleID,
		shift.EmployeeID,
		shift.ShiftDate,
		shift.StartTime,
		shift.EndTime,
		shift.Notes,
		shift.ID,
	).Scan(&shift.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	return nil
}

// Delete removes a scheduled shift by its ID
func (s *ScheduledShiftStore) Delete(ctx context.Context, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM scheduled_shifts WHERE id = $1`

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

// AssignEmployee assigns or unassigns an employee to/from a scheduled shift
func (s *ScheduledShiftStore) AssignEmployee(ctx context.Context, shiftID int64, employeeID *int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	// Validate employee belongs to the restaurant if employee ID is provided
	if employeeID != nil {
		ok, err := s.employeeBelongsToShiftRestaurant(ctx, shiftID, *employeeID)
		if err != nil {
			return err
		}
		if !ok {
			return ErrForbidden
		}

		// Validate employee has the required role for this shift
		hasRole, err := s.employeeHasShiftRole(ctx, shiftID, *employeeID)
		if err != nil {
			return err
		}
		if !hasRole {
			return errors.New("employee does not have the required role for this shift")
		}
	}

	query := `
		UPDATE scheduled_shifts
		SET employee_id = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING id`

	var id int64
	err := s.db.QueryRowContext(ctx, query, employeeID, shiftID).Scan(&id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	return nil
}

// employeeBelongsToShiftRestaurant checks if an employee belongs to the restaurant of a shift
func (s *ScheduledShiftStore) employeeBelongsToShiftRestaurant(ctx context.Context, shiftID, employeeID int64) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT COUNT(*)
		FROM scheduled_shifts ss
		JOIN schedules s ON ss.schedule_id = s.id
		JOIN employees e ON e.restaurant_id = s.restaurant_id
		WHERE ss.id = $1 AND e.id = $2`

	var count int
	err := s.db.QueryRowContext(ctx, query, shiftID, employeeID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// employeeHasShiftRole checks if an employee has the role required by the scheduled shift
func (s *ScheduledShiftStore) employeeHasShiftRole(ctx context.Context, shiftID, employeeID int64) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT COUNT(*)
		FROM scheduled_shifts ss
		JOIN employee_roles er ON er.employee_id = $2 AND er.role_id = ss.role_id
		WHERE ss.id = $1`

	var count int
	err := s.db.QueryRowContext(ctx, query, shiftID, employeeID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}
