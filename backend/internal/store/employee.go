package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Employee struct {
    ID           int64     `db:"id" json:"id"`
    RestaurantID int64     `db:"restaurant_id" json:"restaurant_id"`
    FullName     string    `db:"full_name" json:"full_name"`
    Email        string    `db:"email" json:"email"`
    CreatedAt    time.Time `db:"created_at" json:"created_at"`
    UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type EmployeeRole struct {
    EmployeeID int64 `db:"employee_id" json:"employee_id"`
    RoleID     int64 `db:"role_id" json:"role_id"`
}

type EmployeeStore struct {
	db *sql.DB
}

func (s *EmployeeStore) Create(ctx context.Context, employee *Employee) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO employees (restaurant_id, full_name, email, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, created_at, updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		employee.RestaurantID,
		employee.FullName,
		employee.Email,
	).Scan(&employee.ID, &employee.CreatedAt, &employee.UpdatedAt)

	if err != nil {
		return err
	}

	return nil
}

func (s *EmployeeStore) GetByID(ctx context.Context, id int64) (*Employee, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, full_name, email, created_at, updated_at
		FROM employees
		WHERE id = $1`

	var employee Employee
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&employee.ID,
		&employee.RestaurantID,
		&employee.FullName,
		&employee.Email,
		&employee.CreatedAt,
		&employee.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &employee, nil
}

func (s *EmployeeStore) ListByRestaurant(ctx context.Context, restaurantID int64) ([]*Employee, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, full_name, email, created_at, updated_at
		FROM employees
		WHERE restaurant_id = $1
		ORDER BY full_name`

	rows, err := s.db.QueryContext(ctx, query, restaurantID)
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

func (s *EmployeeStore) Update(ctx context.Context, employee *Employee) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE employees
		SET full_name = $1, email = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		employee.FullName,
		employee.Email,
		employee.ID,
	).Scan(&employee.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	return nil
}

func (s *EmployeeStore) Delete(ctx context.Context, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM employees WHERE id = $1`

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

// Replace stub implementations with real implementations
func (s *EmployeeStore) AssignRoles(ctx context.Context, employeeID int64, roleIDs []int64) error {
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
				FROM employee_roles 
				WHERE employee_id = $1 AND role_id = $2
			)`

		err := tx.QueryRowContext(ctx, checkQuery, employeeID, roleID).Scan(&exists)
		if err != nil {
			return err
		}

		if exists {
			continue // Skip if already assigned
		}

		// Insert the new role assignment
		insertQuery := `
			INSERT INTO employee_roles (employee_id, role_id)
			VALUES ($1, $2)`

		_, err = tx.ExecContext(ctx, insertQuery, employeeID, roleID)
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

func (s *EmployeeStore) RemoveRole(ctx context.Context, employeeID int64, roleID int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		DELETE FROM employee_roles
		WHERE employee_id = $1 AND role_id = $2`

	result, err := s.db.ExecContext(ctx, query, employeeID, roleID)
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

func (s *EmployeeStore) GetRoles(ctx context.Context, employeeID, restaurantID int64) ([]*Role, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT r.id, r.restaurant_id, r.name, r.created_at, r.updated_at
		FROM roles r
		INNER JOIN employee_roles er ON r.id = er.role_id
		WHERE er.employee_id = $1
		  AND r.restaurant_id = $2
		ORDER BY r.name ASC`

	rows, err := s.db.QueryContext(ctx, query, employeeID, restaurantID)
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