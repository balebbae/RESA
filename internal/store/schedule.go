package store

import (
	"context"
	"database/sql"
	"time"
)

type Schedule struct {
    ID           int64     `db:"id" json:"id"`
    RestaurantID int64     `db:"restaurant_id" json:"restaurant_id"`
    StartDate    string    `db:"start_date" json:"start_date"` // YYYY-MM-DD
    EndDate      string    `db:"end_date" json:"end_date"`     // YYYY-MM-DD
    PublishedAt  *time.Time `db:"published_at" json:"published_at,omitempty"`
    CreatedAt    time.Time  `db:"created_at" json:"created_at"`
    UpdatedAt    time.Time  `db:"updated_at" json:"updated_at"`
}

type ScheduleStore struct {
	db *sql.DB
}

func (s *ScheduleStore) Create(context.Context, *Schedule) error
func (s *ScheduleStore) GetByID(context.Context, int64) (*Schedule, error)
func (s *ScheduleStore) ListByRestaurant(context.Context, int64) ([]*Schedule, error)
func (s *ScheduleStore) Update(context.Context, *Schedule) error
func (s *ScheduleStore) Delete(context.Context, int64) error
func (s *ScheduleStore) Publish(context.Context, int64, time.Time) error