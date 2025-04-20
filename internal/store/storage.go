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
	User          *UserStore
	Restaurant    *RestaurantStore
	Employee      *EmployeeStore
	Role          *RoleStore
	ShiftTemplate *ShiftTemplateStore
	Schedule      *ScheduleStore
	ScheduledShift *ScheduledShiftStore
}

func NewStorage(db *sql.DB) *Storage {
	return &Storage{
		User:          &UserStore{db},
		Restaurant:    &RestaurantStore{db},
		Employee:      &EmployeeStore{db},
		Role:          &RoleStore{db},
		ShiftTemplate: &ShiftTemplateStore{db},
		Schedule:      &ScheduleStore{db},
		ScheduledShift: &ScheduledShiftStore{db},
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