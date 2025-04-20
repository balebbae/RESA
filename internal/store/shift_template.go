package store

import (
	"database/sql"
	"time"
)

type ShiftTemplate struct {
    ID           int64     `db:"id" json:"id"`
    RestaurantID int64     `db:"restaurant_id" json:"restaurant_id"`
    RoleID       int64     `db:"role_id" json:"role_id"`
    DayOfWeek    int       `db:"day_of_week" json:"day_of_week"` // 0=Sun ... 6=Sat
    StartTime    string    `db:"start_time" json:"start_time"`     // stored as TIME in db, use string to avoid timezone confusion in JSON
    EndTime      string    `db:"end_time" json:"end_time"`
    CreatedAt    time.Time `db:"created_at" json:"created_at"`
    UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type ShiftTemplateStore struct {
	db *sql.DB
}

// func (s *ShiftTemplateStore) Create(context.Context, *ShiftTemplate) error
// func (s *ShiftTemplateStore) GetByID(context.Context, int64) (*ShiftTemplate, error)
// func (s *ShiftTemplateStore) ListByRestaurant(context.Context, int64) ([]*ShiftTemplate, error)
// func (s *ShiftTemplateStore) Update(context.Context, *ShiftTemplate) error
// func (s *ShiftTemplateStore) Delete(context.Context, int64) error