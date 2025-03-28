package main

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-chi/chi/v5"
)

const assignmentIDParam = "assignmentID"

type CreateShiftAssignmentPayload struct {
	EmployeeID int64  `json:"employee_id" validate:"required"`
	Status     string `json:"status" validate:"required,oneof=pending confirmed rejected"`
}

// createShiftAssignmentHandler creates a new shift assignment
//	@Summary		Create a shift assignment
//	@Description	Assign an employee to a shift
//	@Tags			shift_assignments
//	@Accept			json
//	@Produce		json
//	@Param			restaurantId	path		int								true	"Restaurant ID"
//	@Param			shiftID			path		int								true	"Shift ID"
//	@Param			payload			body		CreateShiftAssignmentPayload	true	"Shift assignment details"
//	@Success		201				{object}	store.ShiftAssignment
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantId}/shifts/{shiftID}/assignments [post]
func (app *application) createShiftAssignmentHandler(w http.ResponseWriter, r *http.Request) {
	shiftID, err := strconv.ParseInt(chi.URLParam(r, "shiftID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Validate that the shift exists and belongs to the restaurant
	shift, err := app.store.Shift.GetByID(r.Context(), shiftID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	restaurant := getRestaurantFromContext(r)
	if shift.RestaurantID != restaurant.ID {
		app.notFoundResponse(w, r, errors.New("shift does not belong to this restaurant"))
		return
	}

	var payload CreateShiftAssignmentPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Verify that the employee is part of the restaurant
	// This would need to be implemented in the EmployeeMembership store
	// For now, we'll skip this check but in a production app you would want to ensure
	// the employee actually belongs to the restaurant

	assignment := &store.ShiftAssignment{
		ShiftID:    shiftID,
		EmployeeID: payload.EmployeeID,
		Status:     payload.Status,
	}

	if err := app.store.ShiftAssignment.Create(r.Context(), assignment); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, assignment); err != nil {
		app.internalServerError(w, r, err)
	}
}

// listShiftAssignmentsHandler returns all assignments for a shift
//	@Summary		List shift assignments
//	@Description	Get all assignments for a specific shift
//	@Tags			shift_assignments
//	@Accept			json
//	@Produce		json
//	@Param			restaurantId	path		int	true	"Restaurant ID"
//	@Param			shiftID			path		int	true	"Shift ID"
//	@Success		200				{array}		store.ShiftAssignment
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantId}/shifts/{shiftID}/assignments [get]
func (app *application) listShiftAssignmentsHandler(w http.ResponseWriter, r *http.Request) {
	shiftID, err := strconv.ParseInt(chi.URLParam(r, "shiftID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Validate that the shift exists and belongs to the restaurant
	shift, err := app.store.Shift.GetByID(r.Context(), shiftID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	restaurant := getRestaurantFromContext(r)
	if shift.RestaurantID != restaurant.ID {
		app.notFoundResponse(w, r, errors.New("shift does not belong to this restaurant"))
		return
	}

	assignments, err := app.store.ShiftAssignment.GetByShiftID(r.Context(), shiftID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, assignments); err != nil {
		app.internalServerError(w, r, err)
	}
}

// updateShiftAssignmentStatusHandler updates the status of a shift assignment
//	@Summary		Update assignment status
//	@Description	Update the status of a shift assignment (pending, confirmed, rejected)
//	@Tags			shift_assignments
//	@Accept			json
//	@Produce		json
//	@Param			restaurantId	path		int		true	"Restaurant ID"
//	@Param			shiftID			path		int		true	"Shift ID"
//	@Param			assignmentID	path		int		true	"Assignment ID"
//	@Param			status			body		string	true	"New status"
//	@Success		200				{object}	store.ShiftAssignment
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantId}/shifts/{shiftID}/assignments/{assignmentID} [patch]
func (app *application) updateShiftAssignmentStatusHandler(w http.ResponseWriter, r *http.Request) {
	assignmentID, err := strconv.ParseInt(chi.URLParam(r, assignmentIDParam), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	type StatusUpdate struct {
		Status string `json:"status" validate:"required,oneof=pending confirmed rejected"`
	}

	var update StatusUpdate
	if err := readJSON(w, r, &update); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(update); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Get the assignment to verify it belongs to the shift
	assignment, err := app.store.ShiftAssignment.GetByID(r.Context(), assignmentID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Get the shift to verify it belongs to the restaurant
	shift, err := app.store.Shift.GetByID(r.Context(), assignment.ShiftID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	restaurant := getRestaurantFromContext(r)
	if shift.RestaurantID != restaurant.ID {
		app.notFoundResponse(w, r, errors.New("shift does not belong to this restaurant"))
		return
	}

	if err := app.store.ShiftAssignment.UpdateStatus(r.Context(), assignmentID, update.Status); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Get the updated assignment
	assignment, err = app.store.ShiftAssignment.GetByID(r.Context(), assignmentID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, assignment); err != nil {
		app.internalServerError(w, r, err)
	}
}

// deleteShiftAssignmentHandler removes a shift assignment
//	@Summary		Delete assignment
//	@Description	Remove an employee assignment from a shift
//	@Tags			shift_assignments
//	@Accept			json
//	@Produce		json
//	@Param			restaurantId	path		int	true	"Restaurant ID"
//	@Param			shiftID			path		int	true	"Shift ID"
//	@Param			assignmentID	path		int	true	"Assignment ID"
//	@Success		204				{object}	nil
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantId}/shifts/{shiftID}/assignments/{assignmentID} [delete]
func (app *application) deleteShiftAssignmentHandler(w http.ResponseWriter, r *http.Request) {
	assignmentID, err := strconv.ParseInt(chi.URLParam(r, assignmentIDParam), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Get the assignment to verify it belongs to the shift
	assignment, err := app.store.ShiftAssignment.GetByID(r.Context(), assignmentID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Get the shift to verify it belongs to the restaurant
	shift, err := app.store.Shift.GetByID(r.Context(), assignment.ShiftID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	restaurant := getRestaurantFromContext(r)
	if shift.RestaurantID != restaurant.ID {
		app.notFoundResponse(w, r, errors.New("shift does not belong to this restaurant"))
		return
	}

	if err := app.store.ShiftAssignment.Delete(r.Context(), assignmentID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// listEmployeeAssignmentsHandler gets all shift assignments for an employee
//	@Summary		List employee assignments
//	@Description	Get all shift assignments for a specific employee
//	@Tags			shift_assignments
//	@Accept			json
//	@Produce		json
//	@Param			employeeID	path		int	true	"Employee ID"
//	@Success		200			{array}		store.ShiftAssignment
//	@Failure		400			{object}	error
//	@Failure		401			{object}	error
//	@Failure		500			{object}	error
//	@Security		ApiKeyAuth
//	@Router			/employees/{employeeID}/assignments [get]
func (app *application) listEmployeeAssignmentsHandler(w http.ResponseWriter, r *http.Request) {
	employeeID, err := strconv.ParseInt(chi.URLParam(r, "employeeID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	assignments, err := app.store.ShiftAssignment.GetByEmployeeID(r.Context(), employeeID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, assignments); err != nil {
		app.internalServerError(w, r, err)
	}
} 