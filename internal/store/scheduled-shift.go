package store

import (
	"context"
	"database/sql"
)

type ScheduledShift struct {

}

type ScheduledShiftStore struct {
	db *sql.DB
}

func (s *ScheduledShiftStore) Create(context.Context, *ScheduledShift) error 
func (s *ScheduledShiftStore) BatchCreate(context.Context, []*ScheduledShift) error
func (s *ScheduledShiftStore) GetByID(context.Context, int64) (*ScheduledShift, error)
func (s *ScheduledShiftStore) ListBySchedule(context.Context, int64) ([]*ScheduledShift, error)
func (s *ScheduledShiftStore) Update(context.Context, *ScheduledShift) error
func (s *ScheduledShiftStore) Delete(context.Context, int64) error
func (s *ScheduledShiftStore) AssignEmployee(context.Context, int64, *int64) error
