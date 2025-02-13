package store

import (
	"database/sql"
	"time"
)

type Rest struct {
	ID int64 `json:"id"`
	EmployerID int64 `json:"employer_id"`
	Name string `json:"name"`
	Address string `json:"address"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// type ResaEmployee struct {
// 	ID int64 `json:"id"`
// 	ResaID int64 `json:"resa_id"`
// 	EmployeeID string `json:"employee_id"`
// 	JoinedAt time.Time `json:"joined_at"`
// }

type RestStore struct {
	db *sql.DB
}

// func (s *ResaStore) Create(ctx context.Context, resa *Resa) error {
// 	query := `
// 		INERST INTO
// 	`
// }

