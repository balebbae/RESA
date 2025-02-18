package store

import (
	"context"
	"database/sql"
	"time"
)

type EmployeeMembership struct {
	ID int64 `json:"id"`
	RestaurantID int64 `json:"restaurant_id"`
	EmployeeID int64 `json:"employee_id"`
	JoinedAt time.Time `json:"joined_at"`
}

type EmployeeMembershipStore struct {
	db *sql.DB
}


func (s *EmployeeMembershipStore) GetRestaurantEmployees(ctx context.Context, id int64) ([]User, error) {

	var users []User
	return users, nil
}

func (s *EmployeeMembershipStore) CreateEmployeeToRestaurant(ctx context.Context, restaurantID, employeeID int64) error {
	query := `
		INSERT INTO employee_memberships (restaurant_id, employee_id) VALUES ($1, $2)
	`

	ctx, cancel := context.WithTimeout(ctx, QueryTimeoutDuration)
	defer cancel()

	_, err := s.db.ExecContext(ctx, query, restaurantID, employeeID)
	if err != nil {
		return err
	}
	return nil
}



func (s *EmployeeMembershipStore) DeleteEmployeeFromRestaurant(ctx context.Context, id int64) error {
	return nil	
}