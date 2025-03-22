package main

import "net/http"

type shiftKey string 
const shiftCtx shiftKey = "shift"

type CreateShiftHandler struct {
	RestaurantID int64 `json:"restaurant_id" validate:"required"`
	StartTime string
	EndTime string
	Position int64
}

// CreateShift godoc
//
//	@Summary		Creates a Shift
//	@Description	Creates a Shift
//	@Tags			shift
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		CreateShiftPayload	true	"Shift payload"
//	@Success		201		{object}	store.Shift
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurant/{restaurantId}/shift [post]
func (app *application) createShiftHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateShiftHandler

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return 
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return 
	}

	if payload.Name
}