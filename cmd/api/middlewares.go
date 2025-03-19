package main

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-chi/chi/v5"
)

func (app *application) restaurantsContextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		idParam := chi.URLParam(r, "restaurantID")
		id, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			app.internalServerError(w, r, err)
			return 
		}

		ctx := r.Context()

		restaurant, err := app.store.Restaurant.GetByID(ctx, id)
		if err != nil {
			switch {
			case errors.Is(err, store.ErrNotFound):
				app.notFoundResponse(w, r, err)
			default:
				app.internalServerError(w, r, err)
			}
			return 
		}

		ctx = context.WithValue(ctx, restaurantCtx, restaurant)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}


func (app *application) getRestaurantFromCtx(r *http.Request) *store.Restaurant {
	restaurant, _ := r.Context().Value(restaurantCtx).(*store.Restaurant)
	return restaurant
}

func (app *application) BasicAuthMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// read the auth header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				app.unauthorizedBasicErrorResponse(w, r, fmt.Errorf("authorization header is missing"))
				return 
			}
			// parse it -> get the base64
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Basic" {
				app.unauthorizedErrorResponse(w, r, fmt.Errorf("authorization header is malformed"))
				return 
			}
			// decode it
			decoded, err := base64.StdEncoding.DecodeString(parts[1])
			if err != nil {
				app.unauthorizedBasicErrorResponse(w, r, err)
				return 
			}

			username := app.config.auth.basic.user
			pass := app.config.auth.basic.pass

			// check the credentials
			creds := strings.SplitN(string(decoded), ":", 2)
			if len(creds) != 2 || creds[0] != username || creds[1] != pass {
				app.unauthorizedBasicErrorResponse(w, r, fmt.Errorf("invalid credentials"))
			}

			next.ServeHTTP(w, r)
		})
	}
}