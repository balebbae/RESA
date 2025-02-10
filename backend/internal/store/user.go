package store

import (
	"database/sql"
	"time"
)

type Role string

const (
	Employer Role = "employer"
	Employee Role = "employee"

)

type User struct {
	ID int64 `json:"id"`
	Email string `json:"email"`
	Password string `json:"-"`
	FirstName string `json:"first_name"`
	LastName string `json:"last_name"`
	Role Role `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserStore struct {
	db *sql.DB
}

// func (s *UserStore) Create(ctx context.Context, user *User) error {
// 	query := `
// 		INSERT INTO users ()
// 	`
// }
