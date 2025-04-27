package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/balebbae/RESA/docs" // This is required to genearte swagger docs
	"github.com/balebbae/RESA/internal/auth"
	"github.com/balebbae/RESA/internal/env"
	"github.com/balebbae/RESA/internal/mailer"
	"github.com/balebbae/RESA/internal/ratelimiter"
	"github.com/balebbae/RESA/internal/store"
	"github.com/balebbae/RESA/internal/store/cache"
	"go.uber.org/zap"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	httpSwagger "github.com/swaggo/http-swagger" // http-swagger middleware
)

type application struct {
	config config
	store store.Storage
	cacheStorage cache.Storage
	logger *zap.SugaredLogger
	mailer mailer.Client
	authenticator auth.Authenticator
	rateLimiter ratelimiter.Limiter
}

type config struct {
	addr string
	db dbConfig
	env string
	apiURL string
	mail mailConfig
	frontendURL string
	auth authConfig
	redisCfg redisConfig
	rateLimiter ratelimiter.Config
}

type redisConfig struct {
	addr string
	password string
	db int
	enabled bool
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
	  
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{env.GetString("CORS_ALLOWED_ORIGIN", "http://localhost:3000")},
		
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))
	
	if app.config.rateLimiter.Enabled {
		r.Use(app.RateLimiterMiddleware)
	}	

	r.Use(middleware.Timeout(60 * time.Second))
	
	r.Route("/v1", func(r chi.Router) {
		// ───── Public + basic‑auth ─────────────────────────
		r.With(app.BasicAuthMiddleware()).Get("/health", app.healthCheckHandler) // Basic auth middleware

		docsURL := fmt.Sprintf("%s/swagger/doc.json", app.config.addr)
		r.With(app.BasicAuthMiddleware()).Get("/swagger/*", httpSwagger.Handler(httpSwagger.URL(docsURL))) // Basic auth middleware

		// ───── Authentication (public) ─────────────────────
		r.Route("/authentication", func(r chi.Router) {
			r.Post("/user", app.registerUserHandler)
			r.Post("/token", app.createTokenHandler)
			r.Post("/refresh", app.refreshTokenHandler)

		})
		
		// ───── User self‑service ───────────────────────────
		r.Route("/users", func(r chi.Router) {
			r.Put("/activate/{token}", app.activateUserHandler)

			// r.With(app.AuthTokenMiddleware).Get("/me", app.getCurrentUserHandler)
			// r.With(app.AuthTokenMiddleware).Patch("/me", app.updateCurrentUserHandler)
		})

		// ───── All app features require valid JWT ──────────
		r.Route("/restaurants", func(r chi.Router) { 
			r.Use(app.AuthTokenMiddleware) 
			r.Post("/", app.createRestaurantHandler)
			r.Get("/",  app.getRestaurantsHandler)


			r.Route("/{restaurantID}", func(r chi.Router){ 
				r.Use(app.restaurantsContextMiddleware)

				// restaurant CRUD
				r.Get("/", app.getRestaurantHandler)
				r.Patch("/", app.checkRestaurantOwnership(app.updateRestaurantHandler)) 
				r.Delete("/", app.checkRestaurantOwnership(app.deleteRestaurantHandler)) 

				// ── roles
				r.Route("/roles", func(r chi.Router) {
					r.Get("/",  app.getRolesHandler)
					r.Post("/", app.checkRestaurantOwnership(app.createRoleHandler))
					r.Route("/{roleID}", func(r chi.Router) {
						r.Get("/",    app.getRoleHandler)
						r.Patch("/",  app.checkRestaurantOwnership(app.updateRoleHandler))
						r.Delete("/", app.checkRestaurantOwnership(app.deleteRoleHandler))
					})
				})

				// ── employees
				r.Route("/employees", func(r chi.Router) {
					r.Get("/",  app.getEmployeesHandler)
					r.Post("/", app.checkRestaurantOwnership(app.createEmployeeHandler))
					r.Route("/{employeeID}", func(r chi.Router) {
						r.Get("/",    app.getEmployeeHandler)
						r.Patch("/",  app.checkRestaurantOwnership(app.updateEmployeeHandler))
						r.Delete("/", app.checkRestaurantOwnership(app.deleteEmployeeHandler))

						// manage employee ⇄ role
						r.Post("/roles",                app.checkRestaurantOwnership(app.addEmployeeRolesHandler))
						r.Delete("/roles/{roleID}",     app.checkRestaurantOwnership(app.removeEmployeeRoleHandler))
					})
				})

				// ── recurring shift templates
				r.Route("/shift-templates", func(r chi.Router) {
					r.Get("/",  app.getShiftTemplatesHandler)
					r.Post("/", app.checkRestaurantOwnership(app.createShiftTemplateHandler))
					r.Route("/{templateID}", func(r chi.Router) {
						r.Get("/",    app.getShiftTemplateHandler)
						r.Patch("/",  app.checkRestaurantOwnership(app.updateShiftTemplateHandler))
						r.Delete("/", app.checkRestaurantOwnership(app.deleteShiftTemplateHandler))
					})
				})

				// ── weekly schedules
				r.Route("/schedules", func(r chi.Router) {
					r.Get("/",  app.getSchedulesHandler)
					r.Post("/", app.checkRestaurantOwnership(app.createScheduleHandler))

					r.Route("/{scheduleID}", func(r chi.Router) {
						r.Get("/",    app.getScheduleHandler)
						r.Patch("/",  app.checkRestaurantOwnership(app.updateScheduleHandler))
						r.Delete("/", app.checkRestaurantOwnership(app.deleteScheduleHandler))

						// publish (email out)
						r.Post("/publish", app.checkRestaurantOwnership(app.publishScheduleHandler))

						// scheduled shifts inside a schedule
						r.Route("/shifts", func(r chi.Router) {
							r.Get("/",  app.getScheduledShiftsHandler)
							r.Post("/", app.checkRestaurantOwnership(app.createScheduledShiftHandler))

							r.Route("/{shiftID}", func(r chi.Router) {
								r.Get("/",    app.getScheduledShiftHandler)
								r.Patch("/",  app.checkRestaurantOwnership(app.updateScheduledShiftHandler))
								r.Delete("/", app.checkRestaurantOwnership(app.deleteScheduledShiftHandler))

								// assign / unassign employee
								r.Patch("/assign", app.checkRestaurantOwnership(app.assignEmployeeToShiftHandler))
								r.Delete("/assign", app.checkRestaurantOwnership(app.unassignEmployeeFromShiftHandler))
							})
						})
					})
				})
            })
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

	shutdown := make(chan error)

	go func () {
		quit := make(chan os.Signal, 1)

		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		s := <-quit

		ctx, cancel := context.WithTimeout(context.Background(), 5 *time.Second)
		defer cancel()

		app.logger.Infow("server caught", "signal", s.String())

		shutdown <- server.Shutdown(ctx)
	}()

	app.logger.Infow("server has started", "addr", app.config.addr, "env", app.config.env)

	err := server.ListenAndServe()
	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	err = <-shutdown
	if err != nil {
		return err
	}

	app.logger.Infow("server has stopped", "addr", app.config.addr, "env", app.config.env)

	return nil
}