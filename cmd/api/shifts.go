package main

import (
	"net/http"
	"time"

	"github.com/balebbae/RESA/internal/store"
)

type shiftKey string
const shiftCtx shiftKey = "shift"

type CreateShiftPayload struct {
	StartTime time.Time
	EndTime time.Time
	Positions int64
}

// CreateShift godoc
//
//	@Summary		Creates a Shift
//	@Description	Creates a Shift
//	@Tags			shift
//	@Accept			json
//	@Produce		json
//	@Param			restaurantId	path		int					true	"id of the restaurant"
//	@Param			payload			body		CreateShiftPayload	true	"Shift payload"
//	@Success		201				{object}	store.Shift
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantId}/shifts [post]
func (app *application) createShiftHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateShiftPayload

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return 
	}

	restaurant := getRestaurantFromContext(r)
	
	shift := &store.Shift{
		RestaurantID: restaurant.ID, 
		StartTime: payload.StartTime,
		EndTime: payload.EndTime,
		Positions: payload.Positions,
	}

	ctx := r.Context()

	err := app.store.Shift.Create(ctx, shift)
	if err != nil {
		app.internalServerError(w, r, err)
		return 
	}

	if err = app.jsonResponse(w, http.StatusCreated, shift); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}


// GetRestaurant godoc
//
//	@Summary		Fetches a Restaurant
//	@Description	Fetches a Restaurant by ID
//	@Tags			restaurant
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Restaurant ID"
//	@Success		200	{object}	store.Restaurant
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantId}/shifts [post]
// func (app *application) getRestaurantShifsHandler(w http.ResponseWriter, r *http.Request) {
// 	restaurant := getRestaurantFromContext(r)

// 	var shifts []store.Shift

// 	shifts, err := app.store.Shift.GetByRestaurantID(r.Context(), restaurant.ID)
// 	if err != nil {
// 		app.internalServerError(w, r, err)
// 		return
// 	}


// }