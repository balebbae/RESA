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
	User interface {
		Create(context.Context, *sql.Tx, *User) error
		GetByID(context.Context, int64) (*User, error)
		GetByEmail(context.Context, string) (*User, error)
		CreateAndInvite(context.Context, *User, string, time.Duration) error
		Activate(context.Context, string) error
		Delete(context.Context, int64) error
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
	Role interface {
		GetByName(context.Context, string) (*Role, error)
	}
	Shift interface {
		Create(context.Context, *Shift) (error)
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		User: &UserStore{db},
		Restaurant: &RestaurantStore{db},
		EmployeeMembership: &EmployeeMembershipStore{db},
		Role: &RoleStore{db},
		Shift: &ShiftStore{db},
	}
}

func withTx(db *sql.DB, ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}