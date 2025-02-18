package main

import (
	"context"
	"errors"
	"net/http"
	"strconv"

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