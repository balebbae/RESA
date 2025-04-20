package store

import (
	"database/sql"
	"time"
)

type ScheduledShift struct {
    ID              int64      `db:"id" json:"id"`
    ScheduleID      int64      `db:"schedule_id" json:"schedule_id"`
    ShiftTemplateID *int64     `db:"shift_template_id" json:"shift_template_id,omitempty"` // can be null when ad-hoc
    RoleID          int64      `db:"role_id" json:"role_id"`
    EmployeeID      *int64     `db:"employee_id" json:"employee_id,omitempty"`
    ShiftDate       string     `db:"shift_date" json:"shift_date"` // YYYY-MM-DD
    StartTime       string     `db:"start_time" json:"start_time"`
    EndTime         string     `db:"end_time" json:"end_time"`
    CreatedAt       time.Time  `db:"created_at" json:"created_at"`
    UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
}


type ScheduledShiftStore struct {
	db *sql.DB
}

// func (s *ScheduledShiftStore) Create(context.Context, *ScheduledShift) error 
// func (s *ScheduledShiftStore) BatchCreate(context.Context, []*ScheduledShift) error
// func (s *ScheduledShiftStore) GetByID(context.Context, int64) (*ScheduledShift, error)
// func (s *ScheduledShiftStore) ListBySchedule(context.Context, int64) ([]*ScheduledShift, error)
// func (s *ScheduledShiftStore) Update(context.Context, *ScheduledShift) error
// func (s *ScheduledShiftStore) Delete(context.Context, int64) error
// func (s *ScheduledShiftStore) AssignEmployee(context.Context, int64, *int64) error
