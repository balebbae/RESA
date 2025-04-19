package store

import (
	"context"
	"database/sql"
	"time"
)

type Schedule struct {
	
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