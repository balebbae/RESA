package main

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-chi/chi/v5"
)

// Request/Response Payloads

type CreateEventPayload struct {
	Title       string  `json:"title" validate:"required,min=1,max=255"`
	Description string  `json:"description,omitempty"`
	Date        string  `json:"date" validate:"required"`
	StartTime   string  `json:"start_time" validate:"required"`
	EndTime     string  `json:"end_time" validate:"required"`
	EmployeeIDs []int64 `json:"employee_ids,omitempty"`
}

type UpdateEventPayload struct {
	Title       *string `json:"title,omitempty" validate:"omitempty,min=1,max=255"`
	Description *string `json:"description,omitempty"`
	Date        *string `json:"date,omitempty"`
	StartTime   *string `json:"start_time,omitempty"`
	EndTime     *string `json:"end_time,omitempty"`
	EmployeeIDs []int64 `json:"employee_ids,omitempty"`
}

type AssignEventEmployeesPayload struct {
	EmployeeIDs []int64 `json:"employee_ids" validate:"required,dive,gt=0"`
}

// GetEvents godoc
//
//	@Summary		Lists restaurant's events
//	@Description	Fetches all events for a restaurant, optionally filtered by date range
//	@Tags			event
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int		true	"Restaurant ID"
//	@Param			start_date		query		string	false	"Start date filter (YYYY-MM-DD)"
//	@Param			end_date		query		string	false	"End date filter (YYYY-MM-DD)"
//	@Success		200				{array}		store.Event
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/events [get]
func (app *application) getEventsHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access
	restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Check if user owns this restaurant
	user := getUserFromContext(r)
	if restaurant.UserID != user.ID {
		app.notFoundResponse(w, r, errors.New("restaurant not found"))
		return
	}

	// Check for optional date range query params
	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")

	var events []*store.Event

	if startDateStr != "" && endDateStr != "" {
		// Validate date formats
		if _, err := time.Parse("2006-01-02", startDateStr); err != nil {
			app.badRequestResponse(w, r, errors.New("invalid start_date format, use YYYY-MM-DD"))
			return
		}
		if _, err := time.Parse("2006-01-02", endDateStr); err != nil {
			app.badRequestResponse(w, r, errors.New("invalid end_date format, use YYYY-MM-DD"))
			return
		}

		events, err = app.store.Events.ListByRestaurantAndDateRange(
			r.Context(),
			restaurantID,
			store.DateOnly(startDateStr),
			store.DateOnly(endDateStr),
		)
	} else {
		events, err = app.store.Events.ListByRestaurant(r.Context(), restaurantID)
	}

	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err = app.jsonResponse(w, http.StatusOK, events); err != nil {
		app.internalServerError(w, r, err)
	}
}

// CreateEvent godoc
//
//	@Summary		Creates an event
//	@Description	Creates an event for a restaurant
//	@Tags			event
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int					true	"Restaurant ID"
//	@Param			payload			body		CreateEventPayload	true	"Event payload"
//	@Success		201				{object}	store.Event
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/events [post]
func (app *application) createEventHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access
	restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Check if user owns this restaurant
	user := getUserFromContext(r)
	if restaurant.UserID != user.ID {
		app.notFoundResponse(w, r, errors.New("restaurant not found"))
		return
	}

	var payload CreateEventPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Validate date format
	if _, err := time.Parse("2006-01-02", payload.Date); err != nil {
		app.badRequestResponse(w, r, errors.New("invalid date format, use YYYY-MM-DD"))
		return
	}

	// Validate time formats
	if _, err := time.Parse("15:04", payload.StartTime); err != nil {
		app.badRequestResponse(w, r, errors.New("invalid start time format, use 24-hour format (HH:MM)"))
		return
	}

	if _, err := time.Parse("15:04", payload.EndTime); err != nil {
		app.badRequestResponse(w, r, errors.New("invalid end time format, use 24-hour format (HH:MM)"))
		return
	}

	// Ensure end time is after start time
	if payload.StartTime >= payload.EndTime {
		app.badRequestResponse(w, r, errors.New("end time must be after start time"))
		return
	}

	event := &store.Event{
		RestaurantID: restaurantID,
		Title:        strings.TrimSpace(payload.Title),
		Description:  payload.Description,
		Date:         store.DateOnly(payload.Date),
		StartTime:    store.TimeOfDay(payload.StartTime),
		EndTime:      store.TimeOfDay(payload.EndTime),
	}

	if err := app.store.Events.Create(r.Context(), event); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Assign employees if provided
	if len(payload.EmployeeIDs) > 0 {
		// Verify all employees belong to this restaurant
		for _, empID := range payload.EmployeeIDs {
			emp, err := app.store.Employees.GetByID(r.Context(), empID)
			if err != nil {
				if errors.Is(err, store.ErrNotFound) {
					app.badRequestResponse(w, r, errors.New("one or more employees do not exist"))
					return
				}
				app.internalServerError(w, r, err)
				return
			}
			if emp.RestaurantID != restaurantID {
				app.badRequestResponse(w, r, errors.New("one or more employees do not belong to this restaurant"))
				return
			}
		}

		if err := app.store.Events.AssignEmployees(r.Context(), event.ID, payload.EmployeeIDs); err != nil {
			app.internalServerError(w, r, err)
			return
		}
	}

	if err = app.jsonResponse(w, http.StatusCreated, event); err != nil {
		app.internalServerError(w, r, err)
	}
}

// GetEvent godoc
//
//	@Summary		Fetches an event
//	@Description	Fetches an event by ID
//	@Tags			event
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			eventID			path		int	true	"Event ID"
//	@Success		200				{object}	store.Event
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/events/{eventID} [get]
func (app *application) getEventHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	eventID, err := strconv.ParseInt(chi.URLParam(r, "eventID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access
	restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Check if user owns this restaurant
	user := getUserFromContext(r)
	if restaurant.UserID != user.ID {
		app.notFoundResponse(w, r, errors.New("restaurant not found"))
		return
	}

	event, err := app.store.Events.GetByID(r.Context(), eventID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify event belongs to this restaurant
	if event.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("event not found"))
		return
	}

	if err = app.jsonResponse(w, http.StatusOK, event); err != nil {
		app.internalServerError(w, r, err)
	}
}

// UpdateEvent godoc
//
//	@Summary		Updates an event
//	@Description	Updates an event by ID
//	@Tags			event
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int					true	"Restaurant ID"
//	@Param			eventID			path		int					true	"Event ID"
//	@Param			payload			body		UpdateEventPayload	true	"Event payload with optional fields"
//	@Success		200				{object}	store.Event
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/events/{eventID} [patch]
func (app *application) updateEventHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	eventID, err := strconv.ParseInt(chi.URLParam(r, "eventID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access
	restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Check if user owns this restaurant
	user := getUserFromContext(r)
	if restaurant.UserID != user.ID {
		app.notFoundResponse(w, r, errors.New("restaurant not found"))
		return
	}

	// Get existing event
	event, err := app.store.Events.GetByID(r.Context(), eventID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify event belongs to this restaurant
	if event.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("event not found"))
		return
	}

	// Read and validate payload
	var payload UpdateEventPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Update fields if provided
	if payload.Title != nil {
		trimmedTitle := strings.TrimSpace(*payload.Title)
		if trimmedTitle == "" {
			app.badRequestResponse(w, r, errors.New("title cannot be empty or whitespace only"))
			return
		}
		event.Title = trimmedTitle
	}

	if payload.Description != nil {
		event.Description = *payload.Description
	}

	// Store original values for validation
	date := event.Date
	startTime := event.StartTime
	endTime := event.EndTime

	if payload.Date != nil {
		if _, err := time.Parse("2006-01-02", *payload.Date); err != nil {
			app.badRequestResponse(w, r, errors.New("invalid date format, use YYYY-MM-DD"))
			return
		}
		date = store.DateOnly(*payload.Date)
	}

	if payload.StartTime != nil {
		if _, err := time.Parse("15:04", *payload.StartTime); err != nil {
			app.badRequestResponse(w, r, errors.New("invalid start time format, use 24-hour format (HH:MM)"))
			return
		}
		startTime = store.TimeOfDay(*payload.StartTime)
	}

	if payload.EndTime != nil {
		if _, err := time.Parse("15:04", *payload.EndTime); err != nil {
			app.badRequestResponse(w, r, errors.New("invalid end time format, use 24-hour format (HH:MM)"))
			return
		}
		endTime = store.TimeOfDay(*payload.EndTime)
	}

	// Ensure end time is after start time
	if startTime >= endTime {
		app.badRequestResponse(w, r, errors.New("end time must be after start time"))
		return
	}

	// Set validated values
	event.Date = date
	event.StartTime = startTime
	event.EndTime = endTime

	// Save updates
	if err := app.store.Events.Update(r.Context(), event); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Update employee assignments if provided
	if payload.EmployeeIDs != nil {
		// Verify all employees belong to this restaurant
		for _, empID := range payload.EmployeeIDs {
			emp, err := app.store.Employees.GetByID(r.Context(), empID)
			if err != nil {
				if errors.Is(err, store.ErrNotFound) {
					app.badRequestResponse(w, r, errors.New("one or more employees do not exist"))
					return
				}
				app.internalServerError(w, r, err)
				return
			}
			if emp.RestaurantID != restaurantID {
				app.badRequestResponse(w, r, errors.New("one or more employees do not belong to this restaurant"))
				return
			}
		}

		if err := app.store.Events.ReplaceEmployees(r.Context(), event.ID, payload.EmployeeIDs); err != nil {
			app.internalServerError(w, r, err)
			return
		}
	}

	if err = app.jsonResponse(w, http.StatusOK, event); err != nil {
		app.internalServerError(w, r, err)
	}
}

// DeleteEvent godoc
//
//	@Summary		Deletes an event
//	@Description	Deletes an event by ID
//	@Tags			event
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			eventID			path		int	true	"Event ID"
//	@Success		204				{object}	string
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/events/{eventID} [delete]
func (app *application) deleteEventHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	eventID, err := strconv.ParseInt(chi.URLParam(r, "eventID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access
	restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Check if user owns this restaurant
	user := getUserFromContext(r)
	if restaurant.UserID != user.ID {
		app.notFoundResponse(w, r, errors.New("restaurant not found"))
		return
	}

	// Get existing event to verify ownership
	event, err := app.store.Events.GetByID(r.Context(), eventID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify event belongs to this restaurant
	if event.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("event not found"))
		return
	}

	// Delete event (cascade will handle event_employees)
	if err := app.store.Events.Delete(r.Context(), eventID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetEventEmployees godoc
//
//	@Summary		Get employees for an event
//	@Description	Retrieves all employees assigned to an event
//	@Tags			event
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			eventID			path		int	true	"Event ID"
//	@Success		200				{array}		store.Employee
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/events/{eventID}/employees [get]
func (app *application) getEventEmployeesHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	eventID, err := strconv.ParseInt(chi.URLParam(r, "eventID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access
	restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Check if user owns this restaurant
	user := getUserFromContext(r)
	if restaurant.UserID != user.ID {
		app.notFoundResponse(w, r, errors.New("restaurant not found"))
		return
	}

	// Get the event to verify it belongs to this restaurant
	event, err := app.store.Events.GetByID(r.Context(), eventID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if event.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("event not found"))
		return
	}

	employees, err := app.store.Events.GetEmployees(r.Context(), eventID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Return empty array instead of null
	if employees == nil {
		employees = []*store.Employee{}
	}

	if err = app.jsonResponse(w, http.StatusOK, employees); err != nil {
		app.internalServerError(w, r, err)
	}
}

// AssignEventEmployees godoc
//
//	@Summary		Assigns employees to an event
//	@Description	Assigns multiple employees to an event (additive)
//	@Tags			event
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int							true	"Restaurant ID"
//	@Param			eventID			path		int							true	"Event ID"
//	@Param			payload			body		AssignEventEmployeesPayload	true	"Employee IDs payload"
//	@Success		204				{object}	string
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/events/{eventID}/employees [post]
func (app *application) assignEventEmployeesHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	eventID, err := strconv.ParseInt(chi.URLParam(r, "eventID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access
	restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Check if user owns this restaurant
	user := getUserFromContext(r)
	if restaurant.UserID != user.ID {
		app.notFoundResponse(w, r, errors.New("restaurant not found"))
		return
	}

	// Verify event exists and belongs to restaurant
	event, err := app.store.Events.GetByID(r.Context(), eventID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if event.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("event not found"))
		return
	}

	// Parse and validate payload
	var payload AssignEventEmployeesPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Verify all employees exist and belong to this restaurant
	for _, empID := range payload.EmployeeIDs {
		emp, err := app.store.Employees.GetByID(r.Context(), empID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				app.badRequestResponse(w, r, errors.New("one or more employees do not exist"))
				return
			}
			app.internalServerError(w, r, err)
			return
		}
		if emp.RestaurantID != restaurantID {
			app.badRequestResponse(w, r, errors.New("one or more employees do not belong to this restaurant"))
			return
		}
	}

	if err := app.store.Events.AssignEmployees(r.Context(), eventID, payload.EmployeeIDs); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RemoveEventEmployee godoc
//
//	@Summary		Removes an employee from an event
//	@Description	Removes a specific employee from an event
//	@Tags			event
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			eventID			path		int	true	"Event ID"
//	@Param			employeeID		path		int	true	"Employee ID"
//	@Success		204				{object}	string
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/events/{eventID}/employees/{employeeID} [delete]
func (app *application) removeEventEmployeeHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	eventID, err := strconv.ParseInt(chi.URLParam(r, "eventID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	employeeID, err := strconv.ParseInt(chi.URLParam(r, "employeeID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access
	restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Check if user owns this restaurant
	user := getUserFromContext(r)
	if restaurant.UserID != user.ID {
		app.notFoundResponse(w, r, errors.New("restaurant not found"))
		return
	}

	// Verify event exists and belongs to restaurant
	event, err := app.store.Events.GetByID(r.Context(), eventID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if event.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("event not found"))
		return
	}

	// Remove employee from event
	err = app.store.Events.RemoveEmployee(r.Context(), eventID, employeeID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, errors.New("employee is not assigned to this event"))
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
