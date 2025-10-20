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
		Create(context.Context, *sql.Tx, *User) error
		GetByID(context.Context, int64) (*User, error)
		CreateAndInvite(context.Context, *User, string, time.Duration) error
		Activate(context.Context, string) error
		Delete(context.Context, int64) error
		GetByEmail(context.Context, string) (*User, error)
		GetByEmailIncludingInactive(context.Context, string) (*User, error)
		GetByGoogleID(context.Context, string) (*User, error)
		CreateWithGoogle(context.Context, *sql.Tx, *User, string, string) error
		CreateUserWithGoogle(context.Context, *User, string, string) error
		LinkGoogleAccount(context.Context, int64, string, string) error
	}
	Restaurants interface {
		Create(context.Context, *Restaurant) error
		GetByID(context.Context, int64) (*Restaurant, error)
		Update(context.Context, *Restaurant) error
		Delete(context.Context, int64) error
		ListByUser(context.Context, int64) ([]*Restaurant, error)
	}
	Employees interface {
		Create(context.Context, *Employee) error
		GetByID(context.Context, int64) (*Employee, error)
		ListByRestaurant(context.Context, int64) ([]*Employee, error)
		Update(context.Context, *Employee) error
		Delete(context.Context, int64) error
		AssignRoles(context.Context, int64, []int64) error
		RemoveRole(context.Context, int64, int64) error
	}
	Roles interface {
		Create(context.Context, *Role) error
		GetByID(context.Context, int64) (*Role, error)
		ListByRestaurant(context.Context, int64) ([]*Role, error)
		Update(context.Context, *Role) error
		Delete(context.Context, int64) error
	}
	ShiftTemplates interface {
		Create(context.Context, *ShiftTemplate) error
		GetByID(context.Context, int64) (*ShiftTemplate, error)
		ListByRestaurant(context.Context, int64) ([]*ShiftTemplate, error)
		Update(context.Context, *ShiftTemplate) error
		Delete(context.Context, int64) error
	}
	Schedules interface {
		Create(context.Context, *Schedule) error
		GetByID(context.Context, int64) (*Schedule, error)
		ListByRestaurant(context.Context, int64) ([]*Schedule, error)
		Update(context.Context, *Schedule) error
		Delete(context.Context, int64) error
		Publish(context.Context, int64, time.Time) error
	}
	ScheduledShifts interface {
		Create(context.Context, *ScheduledShift) error
		BatchCreate(context.Context, []*ScheduledShift) ([]int64, error)
		GetByID(context.Context, int64) (*ScheduledShift, error) 
		ListBySchedule(context.Context, int64) ([]*ScheduledShift, error)
		ListByRestaurantAndWeek(context.Context, int64, time.Time, time.Time) ([]*ScheduledShift, error) // TODO: consume on http side
		Update(context.Context, *ScheduledShift) error 
		Delete(context.Context, int64) error
		AssignEmployee(context.Context, int64, *int64) error
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
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