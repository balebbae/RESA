package store

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/lib/pq"
)

// Event represents a restaurant event with time and date
type Event struct {
	ID           int64       `json:"id"`
	RestaurantID int64       `json:"restaurant_id"`
	Title        string      `json:"title"`
	Description  string      `json:"description"`
	Date         DateOnly    `json:"date"`
	StartTime    TimeOfDay   `json:"start_time"`
	EndTime      TimeOfDay   `json:"end_time"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
	Employees    []*Employee `json:"employees"`
}

// EventEmployee represents the junction table for event-employee assignments
type EventEmployee struct {
	EventID    int64 `json:"event_id"`
	EmployeeID int64 `json:"employee_id"`
}

type EventStore struct {
	db *sql.DB
}

func NewEventStore(db *sql.DB) *EventStore {
	return &EventStore{db: db}
}

func (s *EventStore) Create(ctx context.Context, event *Event) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO events (restaurant_id, title, description, date, start_time, end_time)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		event.RestaurantID,
		event.Title,
		event.Description,
		event.Date,
		event.StartTime,
		event.EndTime,
	).Scan(&event.ID, &event.CreatedAt, &event.UpdatedAt)

	if err != nil {
		return err
	}

	return nil
}

func (s *EventStore) GetByID(ctx context.Context, id int64) (*Event, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, title, description, date, start_time, end_time, created_at, updated_at
		FROM events
		WHERE id = $1`

	var event Event
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&event.ID,
		&event.RestaurantID,
		&event.Title,
		&event.Description,
		&event.Date,
		&event.StartTime,
		&event.EndTime,
		&event.CreatedAt,
		&event.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	if err := s.fillEmployees(ctx, []*Event{&event}); err != nil {
		return nil, err
	}

	return &event, nil
}

func (s *EventStore) ListByRestaurant(ctx context.Context, restaurantID int64) ([]*Event, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, title, description, date, start_time, end_time, created_at, updated_at
		FROM events
		WHERE restaurant_id = $1
		ORDER BY date, start_time`

	rows, err := s.db.QueryContext(ctx, query, restaurantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*Event

	for rows.Next() {
		var event Event
		err := rows.Scan(
			&event.ID,
			&event.RestaurantID,
			&event.Title,
			&event.Description,
			&event.Date,
			&event.StartTime,
			&event.EndTime,
			&event.CreatedAt,
			&event.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		events = append(events, &event)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	if err := s.fillEmployees(ctx, events); err != nil {
		return nil, err
	}

	return events, nil
}

func (s *EventStore) ListByRestaurantAndDateRange(ctx context.Context, restaurantID int64, startDate, endDate DateOnly) ([]*Event, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, title, description, date, start_time, end_time, created_at, updated_at
		FROM events
		WHERE restaurant_id = $1
		  AND date >= $2
		  AND date <= $3
		ORDER BY date, start_time`

	rows, err := s.db.QueryContext(ctx, query, restaurantID, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*Event

	for rows.Next() {
		var event Event
		err := rows.Scan(
			&event.ID,
			&event.RestaurantID,
			&event.Title,
			&event.Description,
			&event.Date,
			&event.StartTime,
			&event.EndTime,
			&event.CreatedAt,
			&event.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		events = append(events, &event)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	if err := s.fillEmployees(ctx, events); err != nil {
		return nil, err
	}

	return events, nil
}

// fillEmployees populates the Employees field for a slice of events
func (s *EventStore) fillEmployees(ctx context.Context, events []*Event) error {
	if len(events) == 0 {
		return nil
	}

	// Map to access events by ID and collect IDs
	eventMap := make(map[int64]*Event)
	ids := make([]int64, len(events))
	for i, event := range events {
		event.Employees = []*Employee{} // Initialize empty slice
		eventMap[event.ID] = event
		ids[i] = event.ID
	}

	query := `
		SELECT ee.event_id, e.id, e.restaurant_id, e.full_name, e.email, e.created_at, e.updated_at
		FROM employees e
		JOIN event_employees ee ON e.id = ee.employee_id
		WHERE ee.event_id = ANY($1::bigint[])
	`

	rows, err := s.db.QueryContext(ctx, query, pq.Array(ids))
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var eventID int64
		var emp Employee
		err := rows.Scan(
			&eventID,
			&emp.ID,
			&emp.RestaurantID,
			&emp.FullName,
			&emp.Email,
			&emp.CreatedAt,
			&emp.UpdatedAt,
		)
		if err != nil {
			return err
		}

		if event, ok := eventMap[eventID]; ok {
			event.Employees = append(event.Employees, &emp)
		}
	}

	return rows.Err()
}

func (s *EventStore) Update(ctx context.Context, event *Event) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE events
		SET title = $1, description = $2, date = $3, start_time = $4, end_time = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		event.Title,
		event.Description,
		event.Date,
		event.StartTime,
		event.EndTime,
		event.ID,
	).Scan(&event.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	return nil
}

func (s *EventStore) Delete(ctx context.Context, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM events WHERE id = $1`

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

// AssignEmployees assigns multiple employees to an event (additive)
func (s *EventStore) AssignEmployees(ctx context.Context, eventID int64, employeeIDs []int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, employeeID := range employeeIDs {
		// Check if assignment already exists
		var exists bool
		checkQuery := `
			SELECT EXISTS (
				SELECT 1
				FROM event_employees
				WHERE event_id = $1 AND employee_id = $2
			)`

		err := tx.QueryRowContext(ctx, checkQuery, eventID, employeeID).Scan(&exists)
		if err != nil {
			return err
		}

		if exists {
			continue // Skip if already assigned
		}

		// Insert the new assignment
		insertQuery := `
			INSERT INTO event_employees (event_id, employee_id)
			VALUES ($1, $2)`

		_, err = tx.ExecContext(ctx, insertQuery, eventID, employeeID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// RemoveEmployee removes a single employee from an event
func (s *EventStore) RemoveEmployee(ctx context.Context, eventID int64, employeeID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		DELETE FROM event_employees
		WHERE event_id = $1 AND employee_id = $2`

	result, err := s.db.ExecContext(ctx, query, eventID, employeeID)
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

// GetEmployees retrieves all employees assigned to an event
func (s *EventStore) GetEmployees(ctx context.Context, eventID int64) ([]*Employee, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT e.id, e.restaurant_id, e.full_name, e.email, e.created_at, e.updated_at
		FROM employees e
		INNER JOIN event_employees ee ON e.id = ee.employee_id
		WHERE ee.event_id = $1
		ORDER BY e.full_name ASC`

	rows, err := s.db.QueryContext(ctx, query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var employees []*Employee
	for rows.Next() {
		var employee Employee
		err := rows.Scan(
			&employee.ID,
			&employee.RestaurantID,
			&employee.FullName,
			&employee.Email,
			&employee.CreatedAt,
			&employee.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		employees = append(employees, &employee)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return employees, nil
}

// ReplaceEmployees replaces all employee assignments for an event
func (s *EventStore) ReplaceEmployees(ctx context.Context, eventID int64, employeeIDs []int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete all existing assignments
	deleteQuery := `DELETE FROM event_employees WHERE event_id = $1`
	_, err = tx.ExecContext(ctx, deleteQuery, eventID)
	if err != nil {
		return err
	}

	// Insert new assignments
	for _, employeeID := range employeeIDs {
		insertQuery := `
			INSERT INTO event_employees (event_id, employee_id)
			VALUES ($1, $2)`

		_, err = tx.ExecContext(ctx, insertQuery, eventID, employeeID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
