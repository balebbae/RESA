package store

import (
	"context"
	"database/sql"
)

type Employee struct {
	
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