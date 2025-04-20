package main

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/balebbae/RESA/internal/store"
)

// Define envelope type for JSON responses
type envelope map[string]any

type createScheduledShiftRequest struct {
	ShiftTemplateID *int64    `json:"shift_template_id,omitempty"`
	RoleID          int64     `json:"role_id"`
	EmployeeID      *int64    `json:"employee_id,omitempty"`
	ShiftDate       time.Time `json:"shift_date"`
	StartTime       string    `json:"start_time"`
	EndTime         string    `json:"end_time"`
	Notes           string    `json:"notes"`
}

type updateScheduledShiftRequest struct {
	ShiftTemplateID *int64    `json:"shift_template_id,omitempty"`
	RoleID          *int64    `json:"role_id,omitempty"`
	EmployeeID      *int64    `json:"employee_id,omitempty"`
	ShiftDate       *time.Time `json:"shift_date,omitempty"`
	StartTime       *string    `json:"start_time,omitempty"`
	EndTime         *string    `json:"end_time,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
}

type assignEmployeeRequest struct {
	EmployeeID *int64 `json:"employee_id"`
}

// getScheduledShiftsHandler godoc
//
//	@Summary		List all shifts for a schedule
//	@Description	Gets all scheduled shifts for a specific schedule
//	@Tags			scheduled-shifts
//	@Accept			json
//	@Produce		json
//	@Param			restaurantID	path		int	true	"Restaurant ID"
//	@Param			scheduleID		path		int	true	"Schedule ID"
//	@Success		200				{array}		store.ScheduledShift
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantID}/schedules/{scheduleID}/shifts [get]
func (app *application) getScheduledShiftsHandler(w http.ResponseWriter, r *http.Request) {
	scheduleID, err := strconv.ParseInt(chi.URLParam(r, "scheduleID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid schedule ID"))
		return
	}

	// Get shifts for this schedule
	shifts, err := app.store.ScheduledShift.ListBySchedule(r.Context(), scheduleID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	app.jsonResponse(w, http.StatusOK, shifts)
}

// createScheduledShiftHandler godoc
//
//	@Summary		Create a new shift
//	@Description	Creates a new scheduled shift for a specific schedule
//	@Tags			scheduled-shifts
//	@Accept			json
//	@Produce		json
//	@Param			restaurantID	path		int							true	"Restaurant ID"
//	@Param			scheduleID		path		int							true	"Schedule ID"
//	@Param			shift			body		createScheduledShiftRequest	true	"Shift information"
//	@Success		201				{object}	store.ScheduledShift
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantID}/schedules/{scheduleID}/shifts [post]
func (app *application) createScheduledShiftHandler(w http.ResponseWriter, r *http.Request) {
	scheduleID, err := strconv.ParseInt(chi.URLParam(r, "scheduleID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid schedule ID"))
		return
	}

	var req createScheduledShiftRequest
	if err := readJSON(w, r, &req); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}
	
	// Validate time format
	if _, err := time.Parse("15:04", req.StartTime); err != nil {
		app.badRequestResponse(w, r, errors.New("start time must be in format HH:MM"))
		return
	}
	
	if _, err := time.Parse("15:04", req.EndTime); err != nil {
		app.badRequestResponse(w, r, errors.New("end time must be in format HH:MM"))
		return
	}
	
	// Validate end time is after start time
	if req.StartTime >= req.EndTime {
		app.badRequestResponse(w, r, errors.New("end time must be after start time"))
		return
	}

	shift := &store.ScheduledShift{
		ScheduleID:      scheduleID,
		ShiftTemplateID: req.ShiftTemplateID,
		RoleID:          req.RoleID,
		EmployeeID:      req.EmployeeID,
		ShiftDate:       req.ShiftDate,
		StartTime:       req.StartTime,
		EndTime:         req.EndTime,
		Notes:           req.Notes,
	}

	if err := app.store.ScheduledShift.Create(r.Context(), shift); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	app.jsonResponse(w, http.StatusCreated, shift)
}

// getScheduledShiftHandler godoc
//
//	@Summary		Get a shift
//	@Description	Gets a specific scheduled shift by ID
//	@Tags			scheduled-shifts
//	@Accept			json
//	@Produce		json
//	@Param			restaurantID	path		int	true	"Restaurant ID"
//	@Param			scheduleID		path		int	true	"Schedule ID"
//	@Param			shiftID			path		int	true	"Shift ID"
//	@Success		200				{object}	store.ScheduledShift
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID} [get]
func (app *application) getScheduledShiftHandler(w http.ResponseWriter, r *http.Request) {
	shiftID, err := strconv.ParseInt(chi.URLParam(r, "shiftID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid shift ID"))
		return
	}

	shift, err := app.store.ScheduledShift.GetByID(r.Context(), shiftID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	app.jsonResponse(w, http.StatusOK, shift)
}

// updateScheduledShiftHandler godoc
//
//	@Summary		Update a shift
//	@Description	Updates an existing scheduled shift by ID
//	@Tags			scheduled-shifts
//	@Accept			json
//	@Produce		json
//	@Param			restaurantID	path		int							true	"Restaurant ID"
//	@Param			scheduleID		path		int							true	"Schedule ID"
//	@Param			shiftID			path		int							true	"Shift ID"
//	@Param			shift			body		updateScheduledShiftRequest	true	"Updated shift information"
//	@Success		200				{object}	store.ScheduledShift
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID} [patch]
func (app *application) updateScheduledShiftHandler(w http.ResponseWriter, r *http.Request) {
	shiftID, err := strconv.ParseInt(chi.URLParam(r, "shiftID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid shift ID"))
		return
	}

	// Get the existing shift
	shift, err := app.store.ScheduledShift.GetByID(r.Context(), shiftID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	var req updateScheduledShiftRequest
	if err := readJSON(w, r, &req); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Update fields if provided
	if req.ShiftTemplateID != nil {
		shift.ShiftTemplateID = req.ShiftTemplateID
	}
	
	if req.RoleID != nil {
		shift.RoleID = *req.RoleID
	}
	
	if req.EmployeeID != nil {
		shift.EmployeeID = req.EmployeeID
	}
	
	if req.ShiftDate != nil {
		shift.ShiftDate = *req.ShiftDate
	}
	
	if req.StartTime != nil {
		// Validate time format
		if _, err := time.Parse("15:04", *req.StartTime); err != nil {
			app.badRequestResponse(w, r, errors.New("start time must be in format HH:MM"))
			return
		}
		shift.StartTime = *req.StartTime
	}
	
	if req.EndTime != nil {
		// Validate time format
		if _, err := time.Parse("15:04", *req.EndTime); err != nil {
			app.badRequestResponse(w, r, errors.New("end time must be in format HH:MM"))
			return
		}
		shift.EndTime = *req.EndTime
	}
	
	if req.Notes != nil {
		shift.Notes = *req.Notes
	}

	// Validate end time is after start time
	if shift.StartTime >= shift.EndTime {
		app.badRequestResponse(w, r, errors.New("end time must be after start time"))
		return
	}

	if err := app.store.ScheduledShift.Update(r.Context(), shift); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	app.jsonResponse(w, http.StatusOK, shift)
}

// deleteScheduledShiftHandler godoc
//
//	@Summary		Delete a shift
//	@Description	Deletes a scheduled shift by ID
//	@Tags			scheduled-shifts
//	@Accept			json
//	@Produce		json
//	@Param			restaurantID	path		int	true	"Restaurant ID"
//	@Param			scheduleID		path		int	true	"Schedule ID"
//	@Param			shiftID			path		int	true	"Shift ID"
//	@Success		200				{object}	map[string]string
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID} [delete]
func (app *application) deleteScheduledShiftHandler(w http.ResponseWriter, r *http.Request) {
	shiftID, err := strconv.ParseInt(chi.URLParam(r, "shiftID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid shift ID"))
		return
	}

	if err := app.store.ScheduledShift.Delete(r.Context(), shiftID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	message := map[string]string{"message": "scheduled shift deleted"}
	app.jsonResponse(w, http.StatusOK, message)
}

// assignEmployeeToShiftHandler godoc
//
//	@Summary		Assign employee to shift
//	@Description	Assigns an employee to a scheduled shift
//	@Tags			scheduled-shifts
//	@Accept			json
//	@Produce		json
//	@Param			restaurantID	path		int						true	"Restaurant ID"
//	@Param			scheduleID		path		int						true	"Schedule ID"
//	@Param			shiftID			path		int						true	"Shift ID"
//	@Param			employee		body		assignEmployeeRequest	true	"Employee assignment information"
//	@Success		200				{object}	store.ScheduledShift
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}/assign [patch]
func (app *application) assignEmployeeToShiftHandler(w http.ResponseWriter, r *http.Request) {
	shiftID, err := strconv.ParseInt(chi.URLParam(r, "shiftID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	var req assignEmployeeRequest
	if err := readJSON(w, r, &req); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := app.store.ScheduledShift.AssignEmployee(r.Context(), shiftID, req.EmployeeID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Retrieve updated shift
	shift, err := app.store.ScheduledShift.GetByID(r.Context(), shiftID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	app.jsonResponse(w, http.StatusOK, shift)
}

// unassignEmployeeFromShiftHandler godoc
//
//	@Summary		Unassign employee from shift
//	@Description	Removes an employee assignment from a scheduled shift
//	@Tags			scheduled-shifts
//	@Accept			json
//	@Produce		json
//	@Param			restaurantID	path		int	true	"Restaurant ID"
//	@Param			scheduleID		path		int	true	"Schedule ID"
//	@Param			shiftID			path		int	true	"Shift ID"
//	@Success		200				{object}	store.ScheduledShift
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}/assign [delete]
func (app *application) unassignEmployeeFromShiftHandler(w http.ResponseWriter, r *http.Request) {
	shiftID, err := strconv.ParseInt(chi.URLParam(r, "shiftID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Pass nil to unassign
	var nilEmployeeID *int64 = nil
	if err := app.store.ScheduledShift.AssignEmployee(r.Context(), shiftID, nilEmployeeID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Retrieve updated shift
	shift, err := app.store.ScheduledShift.GetByID(r.Context(), shiftID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	app.jsonResponse(w, http.StatusOK, shift)
}