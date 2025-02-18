package store

import (
	"context"
	"database/sql"
	"errors"
	"time"

	_ "github.com/lib/pq"
)

var (
	ErrNotFound = errors.New("resource not found")
	QueryTimeoutDuration = time.Second * 5
)

type Storage struct {
	Users interface {
		Create(context.Context, *User) error
	}
	Restaurant interface {
		Create(context.Context, *Restaurant) error
		GetByID(context.Context, int64) (*Restaurant, error)
		Update(context.Context, *Restaurant) error
		Delete(context.Context, int64) error
	}
	EmployeeMembership interface {
		GetRestaurantEmployees(context.Context, int64) ([]User, error)
		CreateEmployeeToRestaurant(context.Context, int64, int64) error
		DeleteEmployeeFromRestaurant(context.Context, int64) error
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		Users: &UserStore{db},
		Restaurant: &RestaurantStore{db},
		EmployeeMembership: &EmployeeMembershipStore{db},
	}
}

