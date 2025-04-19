package store

import (
	"context"
	"database/sql"
)

type ShiftTemplate struct {
	
}

type ShiftTemplateStore struct {
	db *sql.DB
}

func (s *ShiftTemplateStore) Create(context.Context, *ShiftTemplate) error
func (s *ShiftTemplateStore) GetByID(context.Context, int64) (*ShiftTemplate, error)
func (s *ShiftTemplateStore) ListByRestaurant(context.Context, int64) ([]*ShiftTemplate, error)
func (s *ShiftTemplateStore) Update(context.Context, *ShiftTemplate) error
func (s *ShiftTemplateStore) Delete(context.Context, int64) error