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
		r.With(app.BasicAuthMiddleware()).Get("/health", app.healthCheckHandler) // Basic auth middleware

		docsURL := fmt.Sprintf("%s/swagger/doc.json", app.config.addr)
		r.With(app.BasicAuthMiddleware()).Get("/swagger/*", httpSwagger.Handler(httpSwagger.URL(docsURL))) // Basic auth middleware


		// ---------------------------------
        // Restaurant Endpoints
        // ---------------------------------
		r.Route("/restaurants", func(r chi.Router) { // /v1/rest
			r.Use(app.AuthTokenMiddleware) // authorized to go inside the application 
			r.Post("/", app.createRestaurantHandler)
			r.Route("/{restaurantID}", func(r chi.Router){ // /v1/rest/{restID}
				r.Use(app.restaurantsContextMiddleware)
				r.Get("/", app.getRestaurantHandler) // TODO:: Middleware to allow users who are employees of the rest to see the rest info

				r.Patch("/", app.checkRestaurantOwnership("employer", app.updateRestaurantHandler)) 
				r.Delete("/", app.checkRestaurantOwnership("employer", app.deleteRestaurantHandler)) 

				// ---------------------------------
                // Employee Membership Sub-Endpoints
                // ---------------------------------
				r.Route("/employees", func(r chi.Router){
					r.Get("/", app.getRestaurantEmployeesHandler)
					r.Post("/", app.createEmployeeToRestaurantHandler) // payload employee_id
					r.Delete("/", app.deleteEmployeeFromRestaurantHandler)
				})

				// ---------------------------------
                // Shifts Sub-Endpoints TODO:: FUNCTIONALITY
                // ---------------------------------
                r.Route("/shifts", func(r chi.Router) {
                    // GET all shifts for a restaurant
                    // r.Get("/", app.getRestaurantShifsHandler)
                    // // CREATE new shift
                    r.Post("/", app.checkRestaurantOwnership("employer", app.createShiftHandler))

                    // For a specific shift:
                    r.Route("/{shiftID}", func(r chi.Router) {
                    //     r.Use(app.shiftContextMiddleware) // e.g. load shift, ensure it belongs to restaurant
                    //     // READ a single shift
                    //     r.Get("/", app.getShiftHandler)
                    //     // UPDATE shift
                    //     r.Patch("/", app.checkRestaurantOwnership("employer", app.updateShiftHandler))
                    //     // DELETE shift
                    //     r.Delete("/", app.checkRestaurantOwnership("employer", app.deleteShiftHandler))

                        // -----------------------------
                        // Shift Assignments Sub-route TODO:: FUNCTIONALITY
                        // -----------------------------
                        // r.Route("/assignments", func(r chi.Router) {
                        //     // GET who is assigned to this shift
                        //     r.Get("/", app.listShiftAssignmentsHandler)
                        //     // Assign user to this shift
                        //     r.Post("/", app.checkRestaurantOwnership("employer", app.createShiftAssignmentHandler))
                        //     // Possibly a DELETE endpoint to remove a user from shift
                        //     r.Delete("/{assignmentID}", app.checkRestaurantOwnership("employer", app.deleteShiftAssignmentHandler))
                        // })

                        // -----------------------------
                        // Shift Preferences Sub-route TODO:: FUNCTIONALITY
                        // -----------------------------
                        // r.Route("/preferences", func(r chi.Router) {
                        //     // Possibly employees can set their own preferences
                        //     r.Get("/", app.listShiftPreferencesHandler)
                        //     r.Post("/", app.createShiftPreferenceHandler)
                        //     // A user might update or delete their preference
                        //     r.Patch("/{preferenceID}", app.updateShiftPreferenceHandler)
                        //     r.Delete("/{preferenceID}", app.deleteShiftPreferenceHandler)
                        })
                    })
                })

				// ---------------------------------
				// Restaurant Positions Sub-Endpoints
				// ---------------------------------
				// r.Route("/positions", func(r chi.Router) {
				// 	// GET all positions for this restaurant
				// 	r.Get("/", app.listPositionsHandler)

				// 	// CREATE a new position (e.g., "Server", "Host", etc.)
				// 	r.Post("/", app.checkRestaurantOwnership("employer", app.createPositionHandler))

				// 	// Routes for a specific position:
				// 	r.Route("/{positionID}", func(r chi.Router) {
				// 		r.Use(app.positionContextMiddleware) 
				// 		r.Get("/", app.getPositionHandler)
				// 		r.Patch("/", app.checkRestaurantOwnership("employer", app.updatePositionHandler))
				// 		r.Delete("/", app.checkRestaurantOwnership("employer", app.deletePositionHandler))
				// 	})
				// })


                // ---------------------------------
                // Subscription Endpoints TODO:: FUNCTIONALITY
                // ---------------------------------
                // If each restaurant has exactly one subscription or multiple possible subscriptions:
                // r.Route("/subscription", func(r chi.Router) {
                //     // Get subscription info for a restaurant
                //     r.Get("/", app.getSubscriptionHandler)
                //     // Create a new subscription or change plan
                //     r.Post("/", app.checkRestaurantOwnership("employer", app.createSubscriptionHandler))
                //     r.Patch("/", app.checkRestaurantOwnership("employer", app.updateSubscriptionHandler))
                //     r.Delete("/", app.checkRestaurantOwnership("employer", app.cancelSubscriptionHandler))
                // })
            })

		// ---------------------------------
        // Users Endpoints TODO:: FUNCTIONALITY
        // ---------------------------------
		r.Route("/users", func(r chi.Router) {
			r.Put("/activate/{token}", app.activateUserHandler)
			// add crud to allow users to change restaurant information

			// For a user to read/update their own profile
            // r.With(app.AuthTokenMiddleware).Get("/profile", app.getCurrentUserHandler)
            // r.With(app.AuthTokenMiddleware).Patch("/profile", app.updateCurrentUserHandler)
            // r.With(app.AuthTokenMiddleware).Delete("/profile", app.deleteCurrentUserHandler)

            // Possibly an admin route to list all users, etc.
            // r.With(app.AuthTokenMiddleware, app.checkIsAdmin).Get("/", app.listAllUsersHandler)
		})

        // ---------------------------------
        // Public Authentication Endpoints
        // ---------------------------------
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