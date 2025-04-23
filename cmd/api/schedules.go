package main

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-chi/chi/v5"
)

// type scheduleKey string
// const scheduleCtx scheduleKey = "schedule"

type CreateSchedulePayload struct {
	StartDate string `json:"start_date" validate:"required"` // YYYY-MM-DD
	EndDate   string `json:"end_date" validate:"required"`   // YYYY-MM-DD
}

type UpdateSchedulePayload struct {
	StartDate *string `json:"start_date,omitempty" validate:"omitempty"` // YYYY-MM-DD
	EndDate   *string `json:"end_date,omitempty" validate:"omitempty"`   // YYYY-MM-DD
}

// GetSchedules godoc
//
//	@Summary		Lists restaurant's schedules
//	@Description	Fetches all schedules for a restaurant
//	@Tags			schedule
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Success		200				{array}		store.Schedule
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/schedules [get]
func (app *application) getSchedulesHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
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

	schedules, err := app.store.Schedules.ListByRestaurant(r.Context(), restaurantID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusOK, schedules)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// CreateSchedule godoc
//
//	@Summary		Creates a schedule
//	@Description	Creates a schedule for a restaurant
//	@Tags			schedule
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int						true	"Restaurant ID"
//	@Param			payload			body		CreateSchedulePayload	true	"Schedule payload"
//	@Success		201				{object}	store.Schedule
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/schedules [post]
func (app *application) createScheduleHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
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

	var payload CreateSchedulePayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Validate date formats
	startDate, err := time.Parse("2006-01-02", payload.StartDate)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid start date format, use YYYY-MM-DD"))
		return
	}

	endDate, err := time.Parse("2006-01-02", payload.EndDate)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("invalid end date format, use YYYY-MM-DD"))
		return
	}

	// Ensure end date is after or equal to start date
	if endDate.Before(startDate) {
		app.badRequestResponse(w, r, errors.New("end date must be after or equal to start date"))
		return
	}

	schedule := &store.Schedule{
		RestaurantID: restaurantID,
		StartDate:    payload.StartDate,
		EndDate:      payload.EndDate,
	}

	if err := app.store.Schedules.Create(r.Context(), schedule); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusCreated, schedule)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetSchedule godoc
//
//	@Summary		Fetches a schedule
//	@Description	Fetches a schedule by ID
//	@Tags			schedule
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Schedule ID"
//	@Success		200				{object}	store.Schedule
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/schedules/{id} [get]
func (app *application) getScheduleHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	scheduleID, err := strconv.ParseInt(chi.URLParam(r, "scheduleID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
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

	// Get the schedule
	schedule, err := app.store.Schedules.GetByID(r.Context(), scheduleID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify schedule belongs to this restaurant
	if schedule.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("schedule not found"))
		return
	}

	err = app.jsonResponse(w, http.StatusOK, schedule)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// UpdateSchedule godoc
//
//	@Summary		Updates a schedule
//	@Description	Updates a schedule by ID
//	@Tags			schedule
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int						true	"Restaurant ID"
//	@Param			id				path		int						true	"Schedule ID"
//	@Param			payload			body		UpdateSchedulePayload	true	"Schedule payload"
//	@Success		200				{object}	store.Schedule
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/schedules/{id} [patch]
func (app *application) updateScheduleHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	scheduleID, err := strconv.ParseInt(chi.URLParam(r, "scheduleID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
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

	// Get existing schedule
	schedule, err := app.store.Schedules.GetByID(r.Context(), scheduleID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify schedule belongs to this restaurant
	if schedule.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("schedule not found"))
		return
	}

	// Read and validate payload
	var payload UpdateSchedulePayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Store original dates for validation
	startDate := schedule.StartDate
	endDate := schedule.EndDate

	if payload.StartDate != nil {
		// Validate date format
		_, err := time.Parse("2006-01-02", *payload.StartDate)
		if err != nil {
			app.badRequestResponse(w, r, errors.New("invalid start date format, use YYYY-MM-DD"))
			return
		}
		startDate = *payload.StartDate
	}

	if payload.EndDate != nil {
		// Validate date format
		_, err := time.Parse("2006-01-02", *payload.EndDate)
		if err != nil {
			app.badRequestResponse(w, r, errors.New("invalid end date format, use YYYY-MM-DD"))
			return
		}
		endDate = *payload.EndDate
	}

	// Ensure end date is after or equal to start date
	startDateParsed, _ := time.Parse("2006-01-02", startDate)
	endDateParsed, _ := time.Parse("2006-01-02", endDate)
	if endDateParsed.Before(startDateParsed) {
		app.badRequestResponse(w, r, errors.New("end date must be after or equal to start date"))
		return
	}

	// Set validated dates
	schedule.StartDate = startDate
	schedule.EndDate = endDate

	// Save updates
	if err := app.store.Schedules.Update(r.Context(), schedule); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusOK, schedule)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// DeleteSchedule godoc
//
//	@Summary		Deletes a schedule
//	@Description	Deletes a schedule by ID
//	@Tags			schedule
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Schedule ID"
//	@Success		204				{object}	string
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/schedules/{id} [delete]
func (app *application) deleteScheduleHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	scheduleID, err := strconv.ParseInt(chi.URLParam(r, "scheduleID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
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

	// Get existing schedule to verify ownership
	schedule, err := app.store.Schedules.GetByID(r.Context(), scheduleID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify schedule belongs to this restaurant
	if schedule.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("schedule not found"))
		return
	}

	// Delete schedule
	if err := app.store.Schedules.Delete(r.Context(), scheduleID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// PublishSchedule godoc
//
//	@Summary		Publishes a schedule
//	@Description	Publishes a schedule to make it available to employees
//	@Tags			schedule
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Schedule ID"
//	@Success		204				{object}	string
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/schedules/{id}/publish [post]
func (app *application) publishScheduleHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	scheduleID, err := strconv.ParseInt(chi.URLParam(r, "scheduleID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
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

	// Get existing schedule to verify ownership
	schedule, err := app.store.Schedules.GetByID(r.Context(), scheduleID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify schedule belongs to this restaurant
	if schedule.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("schedule not found"))
		return
	}

	// Check if schedule is already published
	if schedule.PublishedAt != nil {
		app.badRequestResponse(w, r, errors.New("schedule is already published"))
		return
	}

	// Publish schedule with current timestamp
	publishTime := time.Now()
	if err := app.store.Schedules.Publish(r.Context(), scheduleID, publishTime); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
