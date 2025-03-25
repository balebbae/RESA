package main

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-chi/chi/v5"
)

type restaurantKey string
const restaurantCtx restaurantKey = "restaurant"

type CreateRestaurantPayload struct {
	Name       string  `json:"name" validate:"required,max=255"`
	Address    string  `json:"address" validate:"required,max=500"`
	Phone      *string `json:"phone,omitempty" validate:"omitempty,max=20"`
}

// CreatePost godoc
//
//	@Summary		Creates a Restaurant
//	@Description	Creates a Restaurant
//	@Tags			restaurant
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		CreateRestaurantPayload	true	"Restaurant payload"
//	@Success		201		{object}	store.Restaurant
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants [post]
func (app *application) createRestaurantHandler(w http.ResponseWriter, r *http.Request) {
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

	user := getUserFromContext(r)

	// Construct `Rest` struct for DB insertion
	restaurant := &store.Restaurant{
		Name:       payload.Name,
		Address:    payload.Address,
		Phone:      payload.Phone,
		EmployerID: user.ID,
	}

	ctx := r.Context()

	// Insert into DB
	err := app.store.Restaurant.Create(ctx, restaurant)
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

// GetRestaurant godoc
//
//	@Summary		Fetches a Restaurant
//	@Tags			restaurant
//	@Description	Fetches a Restaurant by ID
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Restaurant ID"
//	@Success		200	{object}	store.Restaurant
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{id} [get]
func (app *application) getRestaurantHandler(w http.ResponseWriter, r *http.Request) {
	restaurant := getRestaurantFromContext(r)

	_, err := app.store.Restaurant.GetByID(r.Context(), restaurant.ID)
	if err != nil {
		app.internalServerError(w, r, err)
		return 
	}

	err = app.jsonResponse(w, http.StatusOK, restaurant)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

type UpdateRestaurantPayload struct {
	Name *string `json:"name" validate:"omitempty,max=255"`
	Address *string `json:"address" validate:"omitempty,max=255"`
	Phone *string `json:"phone" validate:"omitempty,max=20"`
}

// UpdateRestaurant godoc
//
//	@Summary		Updates a Restaurant
//	@Description	Updates a Restaurant by ID
//	@Tags			restaurant
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int						true	"Restaurant ID"
//	@Param			payload	body		UpdateRestaurantPayload	true	"Restaurant payload"
//	@Success		200		{object}	store.Restaurant
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{id} [patch]
func (app *application) updateRestaurantHandler(w http.ResponseWriter, r *http.Request) {
	restaurant := getRestaurantFromContext(r)

	var payload UpdateRestaurantPayload
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
		restaurant.Name = *payload.Name
	}

	if payload.Address != nil {
		restaurant.Address = *payload.Address
	}

	if payload.Phone != nil {
		restaurant.Phone = payload.Phone
	} else {
		restaurant.Phone = nil
	}

	err = app.store.Restaurant.Update(r.Context(), restaurant)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusOK, restaurant)
	if err != nil {
		app.internalServerError(w, r, err) 
	}
}

// DeleteRestaurant godoc
//
//	@Summary		Deletes a Restaurant
//	@Description	Delete a Restaurant by ID
//	@Tags			restaurant
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Restaurant ID"
//	@Success		204	{object} string
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{id} [delete]
func (app *application) deleteRestaurantHandler(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "restaurantID")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	err = app.store.Restaurant.Delete(ctx, id)
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

