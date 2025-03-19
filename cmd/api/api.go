package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/balebbae/RESA/docs" // This is required to genearte swagger docs
	"github.com/balebbae/RESA/internal/auth"
	"github.com/balebbae/RESA/internal/mailer"
	"github.com/balebbae/RESA/internal/store"
	"go.uber.org/zap"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	httpSwagger "github.com/swaggo/http-swagger" // http-swagger middleware
)

type application struct {
	config config
	store store.Storage
	logger *zap.SugaredLogger
	mailer mailer.Client
	authenticator auth.Authenticator
}

type config struct {
	addr string
	db dbConfig
	env string
	apiURL string
	mail mailConfig
	frontendURL string
	auth authConfig
}

type authConfig struct {
	basic basicConfig
	token tokenConfig
}

type tokenConfig struct {
	secret string
	exp time.Duration
	iss string
}

type basicConfig struct {
	user string 
	pass string
}

type mailConfig struct {
	sendGrid sendGridConfig
	fromEmail string
	exp time.Duration
}

type sendGridConfig struct {
	apiKey string
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

	// Enable CORS
    r.Use(cors.Handler(cors.Options{
        AllowedOrigins:   []string{app.config.frontendURL},

        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
        ExposedHeaders:   []string{"Link"},
        AllowCredentials: false,
        MaxAge:           300,
    }))

	r.Route("/v1", func(r chi.Router) {
		r.With(app.BasicAuthMiddleware()).Get("/health", app.healthCheckHandler)

		docsURL := fmt.Sprintf("%s/swagger/doc.json", app.config.addr)
		r.With(app.BasicAuthMiddleware()).Get("/swagger/*", httpSwagger.Handler(httpSwagger.URL(docsURL)))

		r.Route("/restaurant", func(r chi.Router) { // /v1/rest
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

		r.Route("/users", func(r chi.Router) {
			r.Put("/activate/{token}", app.activateUserHandler)
			// add crud to allow users to change restaurant information
		})

		// Public Routes
		r.Route("/authentication", func(r chi.Router) {
			r.Post("/user", app.registerUserHandler)
			r.Post("/token", app.createTokenHandler)
		})
	})
	
	return r
}

func (app *application) run(mux http.Handler) error {
	
	docs.SwaggerInfo.Version = version
	docs.SwaggerInfo.Host = app.config.apiURL
	docs.SwaggerInfo.BasePath = "/v1"

	server := &http.Server{
		Addr: app.config.addr,
		Handler: mux,
		WriteTimeout: time.Second * 30,
		ReadTimeout: time.Second * 10,
		IdleTimeout: time.Minute,
	}

		app.logger.Infow("server has started", "addr", app.config.addr, "env", app.config.env)

	return server.ListenAndServe()
}