package main

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/balebbae/RESA/internal/store"
)

// parseFlexibleDate attempts to parse dates in multiple formats:
// 1. ISO 8601 with timestamp: "2025-11-30T00:00:00Z"
// 2. Date-only: "2025-11-30"
// Returns the parsed time truncated to date (00:00:00 UTC)
func parseFlexibleDate(dateStr string) (time.Time, error) {
	// Try ISO 8601 first (accounts for DB JSON serialization)
	t, err := time.Parse(time.RFC3339, dateStr)
	if err == nil {
		return t.Truncate(24 * time.Hour), nil
	}

	// Fall back to date-only format
	t, err = time.Parse("2006-01-02", dateStr)
	if err == nil {
		return t, nil
	}

	return time.Time{}, fmt.Errorf("invalid date format: %s", dateStr)
}

// Define envelope type for JSON responses
// type envelope map[string]any

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
	shifts, err := app.store.ScheduledShifts.ListBySchedule(r.Context(), scheduleID)
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
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid restaurant ID"))
		return
	}

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
		RestaurantID:    restaurantID,
		ShiftTemplateID: req.ShiftTemplateID,
		RoleID:          req.RoleID,
		EmployeeID:      req.EmployeeID,
		ShiftDate:       req.ShiftDate,
		StartTime:       store.TimeOfDay(req.StartTime),
		EndTime:         store.TimeOfDay(req.EndTime),
		Notes:           req.Notes,
	}

	if err := app.store.ScheduledShifts.Create(r.Context(), shift); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Fetch the created shift with joined employee/role data
	createdShift, err := app.store.ScheduledShifts.GetByID(r.Context(), shift.ID)
	if err != nil {
		// Log the error for debugging
		app.logger.Error("Failed to fetch created shift with joined data", "error", err, "shift_id", shift.ID)

		// Fallback: return the shift without joined data
		// The frontend will still work, just without employee/role names initially
		app.jsonResponse(w, http.StatusCreated, shift)
		return
	}

	app.jsonResponse(w, http.StatusCreated, createdShift)
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

	shift, err := app.store.ScheduledShifts.GetByID(r.Context(), shiftID)
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
	shift, err := app.store.ScheduledShifts.GetByID(r.Context(), shiftID)
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
		shift.StartTime = store.TimeOfDay(*req.StartTime)
	}

	if req.EndTime != nil {
		// Validate time format
		if _, err := time.Parse("15:04", *req.EndTime); err != nil {
			app.badRequestResponse(w, r, errors.New("end time must be in format HH:MM"))
			return
		}
		shift.EndTime = store.TimeOfDay(*req.EndTime)
	}
	
	if req.Notes != nil {
		shift.Notes = *req.Notes
	}

	// Validate end time is after start time
	if shift.StartTime >= shift.EndTime {
		app.badRequestResponse(w, r, errors.New("end time must be after start time"))
		return
	}

	if err := app.store.ScheduledShifts.Update(r.Context(), shift); err != nil {
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

	if err := app.store.ScheduledShifts.Delete(r.Context(), shiftID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	message := map[string]string{"message": "scheduled shift deleted"}
	app.jsonResponse(w, http.StatusNoContent, message)
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

	if err := app.store.ScheduledShifts.AssignEmployee(r.Context(), shiftID, req.EmployeeID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Retrieve updated shift	
	shift, err := app.store.ScheduledShifts.GetByID(r.Context(), shiftID)
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
	if err := app.store.ScheduledShifts.AssignEmployee(r.Context(), shiftID, nilEmployeeID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Retrieve updated shift
	shift, err := app.store.ScheduledShifts.GetByID(r.Context(), shiftID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	app.jsonResponse(w, http.StatusOK, shift)
}

// autoPopulateScheduleHandler godoc
//
//	@Summary		Auto-populate schedule with template-based shifts
//	@Description	Creates scheduled shifts for all shift templates that don't have shifts yet
//	@Tags			scheduled-shifts
//	@Accept			json
//	@Produce		json
//	@Param			restaurantID	path		int	true	"Restaurant ID"
//	@Param			scheduleID		path		int	true	"Schedule ID"
//	@Success		200				{object}	map[string]interface{}
//	@Failure		400				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurantID}/schedules/{scheduleID}/auto-populate [post]
func (app *application) autoPopulateScheduleHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid restaurant ID"))
		return
	}

	scheduleID, err := strconv.ParseInt(chi.URLParam(r, "scheduleID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid schedule ID"))
		return
	}

	// Get schedule to verify ownership and get date range
	schedule, err := app.store.Schedules.GetByID(r.Context(), scheduleID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify schedule belongs to the correct restaurant
	if schedule.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("schedule not found"))
		return
	}

	// Verify restaurant ownership
	restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	user := getUserFromContext(r)
	if restaurant.UserID != user.ID {
		app.notFoundResponse(w, r, errors.New("restaurant not found"))
		return
	}

	// Get all shift templates for this restaurant (role_ids included via JSONB)
	templates, err := app.store.ShiftTemplates.ListByRestaurant(r.Context(), restaurantID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Get existing shifts to avoid duplicates
	existingShifts, err := app.store.ScheduledShifts.ListBySchedule(r.Context(), scheduleID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Build map of existing shifts: "date-templateId-roleId" -> true
	existingMap := make(map[string]bool)
	for _, shift := range existingShifts {
		if shift.ShiftTemplateID != nil {
			// Format: "2006-01-02-templateID-roleID"
			key := shift.ShiftDate.Format("2006-01-02") + "-" +
				   strconv.FormatInt(*shift.ShiftTemplateID, 10) + "-" +
				   strconv.FormatInt(shift.RoleID, 10)
			existingMap[key] = true
		}
	}

	// Parse schedule date range (handles both YYYY-MM-DD and ISO 8601 formats)
	startDate, err := parseFlexibleDate(string(schedule.StartDate))
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	endDate, err := parseFlexibleDate(string(schedule.EndDate))
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	var shiftsToCreate []*store.ScheduledShift

	// For each day in the schedule
	for date := startDate; !date.After(endDate); date = date.AddDate(0, 0, 1) {
		dayOfWeek := int(date.Weekday()) // 0=Sunday, 6=Saturday

		// Find templates for this day
		for _, template := range templates {
			if template.DayOfWeek != dayOfWeek {
				continue
			}

			// Skip if template has no roles
			if len(template.RoleIDs) == 0 {
				continue
			}

			// Create shift for each role
			for _, roleID := range template.RoleIDs {
				key := date.Format("2006-01-02") + "-" +
					   strconv.FormatInt(template.ID, 10) + "-" +
					   strconv.FormatInt(roleID, 10)

				// Skip if already exists
				if existingMap[key] {
					continue
				}

				// Create scheduled shift with employee_id = null
				shift := &store.ScheduledShift{
					ScheduleID:      scheduleID,
					RestaurantID:    restaurantID,
					ShiftTemplateID: &template.ID,
					RoleID:          roleID,
					EmployeeID:      nil, // Unassigned
					ShiftDate:       date,
					StartTime:       template.StartTime,
					EndTime:         template.EndTime,
					Notes:           "",
				}

				shiftsToCreate = append(shiftsToCreate, shift)
			}
		}
	}

	// Batch create shifts
	var createdIDs []int64
	if len(shiftsToCreate) > 0 {
		createdIDs, err = app.store.ScheduledShifts.BatchCreate(r.Context(), shiftsToCreate)
		if err != nil {
			app.internalServerError(w, r, err)
			return
		}
	}

	response := map[string]interface{}{
		"created_count": len(createdIDs),
		"created_ids":   createdIDs,
	}

	app.jsonResponse(w, http.StatusOK, response)
}

