package store

import (
	"context"
	"database/sql"
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

func (s *EmployeeStore) Create(context.Context, *Employee) error
func (s *EmployeeStore) GetByID(context.Context, int64) (*Employee, error)
func (s *EmployeeStore) ListByRestaurant(context.Context, int64) ([]*Employee, error) 
func (s *EmployeeStore) Update(context.Context, *Employee) error 
func (s *EmployeeStore) Delete(context.Context, int64) error 

func (s *EmployeeStore) AssignRoles(context.Context, int64, []int64) error 
func (s *EmployeeStore) RemoveRole(context.Context, int64, int64) error