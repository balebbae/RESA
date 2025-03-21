
package main

import (
	"log"

	"github.com/balebbae/RESA/internal/db"
	"github.com/balebbae/RESA/internal/env"
	"github.com/balebbae/RESA/internal/store"
)

func main() {
	addr := env.GetString("DB_ADDR", "postgres://admin:adminpassword@localhost/resa?sslmode=disable")
	conn, err := db.New(addr, 3, 3, "15m")
	if err != nil {
		log.Fatal(err)
	}

	defer conn.Close()

	store := store.NewStorage(conn)

	db.Seed(store, conn)
}