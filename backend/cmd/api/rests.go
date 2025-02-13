package main

import (
	"errors"
	"net/http"

	"github.com/balebbae/RESA/internal/store"
)


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