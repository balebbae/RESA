package store

import (
	"context"
	"database/sql"
	"time"
)

type Role struct {
    ID           int64     `db:"id" json:"id"`
    RestaurantID int64     `db:"restaurant_id" json:"restaurant_id"`
    Name         string    `db:"name" json:"name"`
    CreatedAt    time.Time `db:"created_at" json:"created_at"`
    UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}

type RoleStore struct {
	db *sql.DB
}

func (s *RoleStore) Create(context.Context, *Role) error
func (s *RoleStore) GetByID(context.Context, int64) (*Role, error)
func (s *RoleStore) ListByRestaurant(context.Context, int64) ([]*Role, error)
func (s *RoleStore) Update(context.Context, *Role) error
func (s *RoleStore) Delete(context.Context, int64) error