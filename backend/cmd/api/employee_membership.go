package main

import (
	"errors"
	"net/http"
)

type AddEmployee struct {
	EmployeeID int64 `json:"employee_id" validate:"required"`
}

func (app *application) createEmployeeToRestaurantHandler(w http.ResponseWriter, r *http.Request) {
	restaurant := app.getRestaurantFromCtx(r)
    if restaurant == nil {
        app.notFoundResponse(w, r, errors.New("restaurant not found in context"))
        return
    }

    // Now read the JSON payload for the employee_id.
    var payload struct {
        EmployeeID int64 `json:"employee_id" validate:"required"`
    }

    if err := readJSON(w, r, &payload); err != nil {
        app.badRequestResponse(w, r, err)
        return
    }

    // Optional: Validate the payload if using a validator.
    if err := Validate.Struct(payload); err != nil {
        app.badRequestResponse(w, r, err)
        return
    }

    // Add the employee to the restaurant.
    ctx := r.Context()
    if err := app.store.EmployeeMembership.CreateEmployeeToRestaurant(ctx, restaurant.ID, payload.EmployeeID); err != nil {
        // Handle DB errors (unique constraint, foreign key, etc.)
        app.internalServerError(w, r, err)
        return
    }

    // Return a success response (e.g. 201 or 204).
    w.WriteHeader(http.StatusCreated)
}



func (app *application) getRestaurantEmployeesHandler(w http.ResponseWriter, r *http.Request) {

}

func (app *application) deleteEmployeeFromRestaurantHandler(w http.ResponseWriter, r *http.Request) {

}