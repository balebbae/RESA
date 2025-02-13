package store

import (
	"context"
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

func (s *UserStore) Create(ctx context.Context, user *User) error {
	query := `
		INSERT INTO users (email, password, first_name, last_name, role) 
		VALUES ($1, $2, $3, $4, $5) 
		RETURNED id, created_at, updated_at
		`

	err := s.db.QueryRowContext(
		ctx,
		query,
		user.Email,
		user.Password,
		user.FirstName,
		user.LastName,
		user.Role,
	).Scan(
		&user.ID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return err
	}

	return nil
}
