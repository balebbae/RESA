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

    var payload struct {
        EmployeeID int64 `json:"employee_id" validate:"required"`
    }

    if err := readJSON(w, r, &payload); err != nil {
        app.badRequestResponse(w, r, err)
        return
    }

    if err := Validate.Struct(payload); err != nil {
        app.badRequestResponse(w, r, err)
        return
    }

    // Add the employee to the restaurant.
    ctx := r.Context()
    if err := app.store.EmployeeMembership.CreateEmployeeToRestaurant(ctx, restaurant.ID, payload.EmployeeID); err != nil {
        app.internalServerError(w, r, err)
        return
    }

    w.WriteHeader(http.StatusCreated)
}



func (app *application) getRestaurantEmployeesHandler(w http.ResponseWriter, r *http.Request) {

}

func (app *application) deleteEmployeeFromRestaurantHandler(w http.ResponseWriter, r *http.Request) {

}