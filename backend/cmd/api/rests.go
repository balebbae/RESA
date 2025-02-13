package main

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-chi/chi/v5"
)

type restKey string
const restCtx restKey = "rest"

type CreateRestaurantPayload struct {
	Name       string  `json:"name" validate:"required,max=255"`
	Address    string  `json:"address" validate:"required,max=500"`
	Phone      *string `json:"phone,omitempty" validate:"omitempty,max=20"`
	EmployerID int64   `json:"employer_id" validate:"required"` // Should come from authentication
}

// Create a restaurant handler
func (app *application) createRestHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateRestaurantPayload

	// Read JSON payload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Validate input using go-playground/validator
	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Ensure required fields are not empty
	if payload.Name == "" || payload.Address == "" {
		app.badRequestResponse(w, r, errors.New("name and address are required"))
		return
	}

	// Construct `Rest` struct for DB insertion
	restaurant := &store.Rest{
		Name:       payload.Name,
		Address:    payload.Address,
		Phone:      payload.Phone,
		EmployerID: 1, //payload.EmployerID, // This should be replaced with authenticated user ID later
	}

	ctx := r.Context()

	// Insert into DB
	err := app.store.Rest.Create(ctx, restaurant)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Send JSON response
	if err = app.jsonResponse(w, http.StatusCreated, restaurant); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

func (app *application) getRestHandler(w http.ResponseWriter, r *http.Request) {
	rest := getRestFromCtx(r)

	_, err := app.store.Rest.GetByID(r.Context(), rest.ID)
	if err != nil {
		app.internalServerError(w, r, err)
		return 
	}

	err = app.jsonResponse(w, http.StatusOK, rest)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

type UpdateRestPayload struct {
	Name *string `json:"name" validate:"omitempty,max=255"`
	Address *string `json:"address" validate:"omitempty,max=255"`
	Phone *string `json:"phone" validate:"omitempty,max=20"`
}

func (app *application) updateRestHandler(w http.ResponseWriter, r *http.Request) {
	rest := getRestFromCtx(r)

	var payload UpdateRestPayload
	err := readJSON(w, r, &payload)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	err = Validate.Struct(payload)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if payload.Name != nil {
		rest.Name = *payload.Name
	}

	if payload.Address != nil {
		rest.Address = *payload.Address
	}

	if payload.Phone != nil {
		rest.Phone = payload.Phone
	} else {
		rest.Phone = nil
	}

	err = app.store.Rest.Update(r.Context(), rest)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusOK, rest)
	if err != nil {
		app.internalServerError(w, r, err) 
	}
}

func (app *application) deleteRestHandler(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "restID")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	err = app.store.Rest.Delete(ctx, id)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}


func (app *application) restsContextMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		idParam := chi.URLParam(r, "restID")
		id, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			app.internalServerError(w, r, err)
			return 
		}

		ctx := r.Context()

		rest, err := app.store.Rest.GetByID(ctx, id)
		if err != nil {
			switch {
			case errors.Is(err, store.ErrNotFound):
				app.notFoundResponse(w, r, err)
			default:
				app.internalServerError(w, r, err)
			}
			return 
		}

		ctx = context.WithValue(ctx, restCtx, rest)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}


func getRestFromCtx(r *http.Request) *store.Rest {
	rest, _ := r.Context().Value(restCtx).(*store.Rest)
	return rest
}