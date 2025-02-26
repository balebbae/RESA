package main

import (
	"log"
	"net/http"
	"time"

	"github.com/balebbae/RESA/internal/store"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type application struct {
	config config
	store store.Storage
}

type config struct {
	addr string
	db dbConfig
	env string
}

type dbConfig struct {
	addr string
	maxOpenConns int
	maxIdleConns int
	maxIdleTime string
}

func (app *application) mount() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
  	r.Use(middleware.RealIP)
  	r.Use(middleware.Logger)
  	r.Use(middleware.Recoverer)

	r.Use(middleware.Timeout(60 * time.Second))

	r.Route("/v1", func(r chi.Router) {
		r.Get("/health", app.healthCheckHandler)

		r.Route("/users", func(r chi.Router) {
			r.Post("/", app.createUserHandler)
		})

		r.Route("/restaurants", func(r chi.Router) { // /v1/rest
			r.Post("/", app.createRestaurantHandler)
			r.Route("/{restaurantID}", func(r chi.Router){ // /v1/rest/{restID}
				r.Use(app.restaurantsContextMiddleware)
				r.Get("/", app.getRestaurantHandler)
				r.Patch("/", app.updateRestaurantHandler)
				r.Delete("/", app.deleteRestaurantHandler)
				r.Route("/employees", func(r chi.Router){
					r.Get("/", app.getRestaurantEmployeesHandler)
					r.Post("/", app.createEmployeeToRestaurantHandler) // payload employee_id
					r.Delete("/", app.deleteEmployeeFromRestaurantHandler)
				})
			})
			
		})
	})
	
	return r
}

func (app *application) run(mux http.Handler) error {
	
	server := &http.Server{
		Addr: app.config.addr,
		Handler: mux,
		WriteTimeout: time.Second * 30,
		ReadTimeout: time.Second * 10,
		IdleTimeout: time.Minute,
	}

	log.Printf("server has started at %s", app.config.addr)

	return server.ListenAndServe()
}