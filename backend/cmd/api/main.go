package main

import "log"

const version = "0.0.1"

func main() {
	cfg := config{
		addr: ":8080",
		env: "development",
	}

	// db, err := db.New(
	// 	cfg.db.addr,
	// 	cfg.db.maxOpenConns,
	// 	cfg.db.maxIdleConns,
	// 	cfg.db.maxIdleTime,
	// )
	// if err != nil {
	// 	log.Panic(err)
	// }

	// defer db.Close()
	
	// log.Println("db connection established")

	// store := store.NewStorage(db)

	app := &application{
		config: cfg,
		// store: store,
	}

	mux := app.mount()

	log.Fatal(app.run(mux))
}