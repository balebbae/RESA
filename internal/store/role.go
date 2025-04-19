package store

import (
	"context"
	"database/sql"
)

type Role struct {
	
}

type RoleStore struct {
	db *sql.DB
}

func (s *RoleStore) Create(context.Context, *Role) error
func (s *RoleStore) GetByID(context.Context, int64) (*Role, error)
func (s *RoleStore) ListByRestaurant(context.Context, int64) ([]*Role, error)
func (s *RoleStore) Update(context.Context, *Role) error
func (s *RoleStore) Delete(context.Context, int64) error