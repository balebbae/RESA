package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

// ShiftAssignment represents an assignment of an employee to a shift
type ShiftAssignment struct {
	ID          int64     `json:"id"`
	ShiftID     int64     `json:"shift_id"`
	EmployeeID  int64     `json:"employee_id"`
	Status      string    `json:"status"` // "pending", "confirmed", "rejected"
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ShiftAssignmentStore handles database operations for shift assignments
type ShiftAssignmentStore struct {
	db *sql.DB
}

// Create adds a new shift assignment to the database
func (s *ShiftAssignmentStore) Create(ctx context.Context, assignment *ShiftAssignment) error {
	query := `
		INSERT INTO shift_assignments (shift_id, employee_id, status)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at;
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	err := s.db.QueryRowContext(
		ctx,
		query,
		assignment.ShiftID,
		assignment.EmployeeID,
		assignment.Status,
	).Scan(
		&assignment.ID,
		&assignment.CreatedAt,
		&assignment.UpdatedAt,
	)

	if err != nil {
		return err
	}

	return nil
}

// GetByID retrieves a shift assignment by its ID
func (s *ShiftAssignmentStore) GetByID(ctx context.Context, id int64) (*ShiftAssignment, error) {
	query := `
		SELECT
			id, shift_id, employee_id, status, created_at, updated_at
		FROM
			shift_assignments
		WHERE 
			id = $1
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	var assignment ShiftAssignment

	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&assignment.ID,
		&assignment.ShiftID,
		&assignment.EmployeeID,
		&assignment.Status,
		&assignment.CreatedAt,
		&assignment.UpdatedAt,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, ErrNotFound
		default:
			return nil, err
		}
	}

	return &assignment, nil
}

// GetByShiftID retrieves all assignments for a specific shift
func (s *ShiftAssignmentStore) GetByShiftID(ctx context.Context, shiftID int64) ([]ShiftAssignment, error) {
	query := `
		SELECT 
			id, shift_id, employee_id, status, created_at, updated_at
		FROM 
			shift_assignments
		WHERE 
			shift_id = $1
		ORDER BY 
			created_at ASC
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, query, shiftID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assignments []ShiftAssignment

	for rows.Next() {
		var assignment ShiftAssignment
		if err := rows.Scan(
			&assignment.ID,
			&assignment.ShiftID,
			&assignment.EmployeeID,
			&assignment.Status,
			&assignment.CreatedAt,
			&assignment.UpdatedAt,
		); err != nil {
			return nil, err
		}
		assignments = append(assignments, assignment)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return assignments, nil
}

// GetByEmployeeID retrieves all assignments for a specific employee
func (s *ShiftAssignmentStore) GetByEmployeeID(ctx context.Context, employeeID int64) ([]ShiftAssignment, error) {
	query := `
		SELECT 
			id, shift_id, employee_id, status, created_at, updated_at
		FROM 
			shift_assignments
		WHERE 
			employee_id = $1
		ORDER BY 
			created_at ASC
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	rows, err := s.db.QueryContext(ctx, query, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assignments []ShiftAssignment

	for rows.Next() {
		var assignment ShiftAssignment
		if err := rows.Scan(
			&assignment.ID,
			&assignment.ShiftID,
			&assignment.EmployeeID,
			&assignment.Status,
			&assignment.CreatedAt,
			&assignment.UpdatedAt,
		); err != nil {
			return nil, err
		}
		assignments = append(assignments, assignment)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return assignments, nil
}

// UpdateStatus updates the status of a shift assignment
func (s *ShiftAssignmentStore) UpdateStatus(ctx context.Context, id int64, status string) error {
	query := `
		UPDATE 
			shift_assignments
		SET 
			status = $1,
			updated_at = NOW()
		WHERE 
			id = $2
		RETURNING updated_at
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	var updatedAt time.Time
	err := s.db.QueryRowContext(ctx, query, status, id).Scan(&updatedAt)
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

// Delete removes a shift assignment from the database
func (s *ShiftAssignmentStore) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM shift_assignments WHERE id = $1`

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