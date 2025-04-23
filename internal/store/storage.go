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
	Users          *UserStore
	Restaurants    *RestaurantStore
	Employees      *EmployeeStore
	Roles          *RoleStore
	ShiftTemplates *ShiftTemplateStore
	Schedules      *ScheduleStore
	ScheduledShifts *ScheduledShiftStore
}

func NewStorage(db *sql.DB) *Storage {
	return &Storage{
		Users:          &UserStore{db},
		Restaurants:    &RestaurantStore{db},
		Employees:      &EmployeeStore{db},
		Roles:          &RoleStore{db},
		ShiftTemplates: &ShiftTemplateStore{db},
		Schedules:      &ScheduleStore{db},
		ScheduledShifts: &ScheduledShiftStore{db},
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