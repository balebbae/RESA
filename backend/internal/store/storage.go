package store

import (
	"database/sql"
	"errors"

	_ "github.com/lib/pq"
)

var (
	ErrNotFound = errors.New("resource not found")
)

type Storage struct {
	Users interface {
		// Create(context.Context, *User) error
	}
}

func NewStorage(db *sql.DB) Storage {
	return Storage{
		// Posts: &PostStore{db},
		Users: &UserStore{db},
	}
}

