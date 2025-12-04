package store

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Role struct {
    ID           int64     `db:"id" json:"id"`
    RestaurantID int64     `db:"restaurant_id" json:"restaurant_id"`
    Name         string    `db:"name" json:"name"`
    Color        string    `db:"color" json:"color"`
    CreatedAt    time.Time `db:"created_at" json:"created_at"`
    UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type RoleStore struct {
	db *sql.DB
}

func (s *RoleStore) Create(ctx context.Context, role *Role) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		INSERT INTO roles (restaurant_id, name, color, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, created_at, updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		role.RestaurantID,
		role.Name,
		role.Color,
	).Scan(&role.ID, &role.CreatedAt, &role.UpdatedAt)

	if err != nil {
		return err
	}

	return nil
}

func (s *RoleStore) GetByID(ctx context.Context, id int64) (*Role, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, name, color, created_at, updated_at
		FROM roles
		WHERE id = $1`

	var role Role
	err := s.db.QueryRowContext(ctx, query, id).Scan(
		&role.ID,
		&role.RestaurantID,
		&role.Name,
		&role.Color,
		&role.CreatedAt,
		&role.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}

	return &role, nil
}

func (s *RoleStore) ListByRestaurant(ctx context.Context, restaurantID int64) ([]*Role, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT id, restaurant_id, name, color, created_at, updated_at
		FROM roles
		WHERE restaurant_id = $1
		ORDER BY name`

	rows, err := s.db.QueryContext(ctx, query, restaurantID)
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

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return roles, nil
}

func (s *RoleStore) Update(ctx context.Context, role *Role) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		UPDATE roles
		SET name = $1, color = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING updated_at`

	err := s.db.QueryRowContext(
		ctx,
		query,
		role.Name,
		role.Color,
		role.ID,
	).Scan(&role.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	return nil
}

func (s *RoleStore) Delete(ctx context.Context, id int64) error {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `DELETE FROM roles WHERE id = $1`

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

func (s *RoleStore) GetEmployees(ctx context.Context, roleID, restaurantID int64) ([]*Employee, error) {
	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	query := `
		SELECT e.id, e.restaurant_id, e.full_name, e.email, e.created_at, e.updated_at
		FROM employees e
		INNER JOIN employee_roles er ON e.id = er.employee_id
		WHERE er.role_id = $1
		  AND e.restaurant_id = $2
		ORDER BY e.full_name ASC`

	rows, err := s.db.QueryContext(ctx, query, roleID, restaurantID)
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