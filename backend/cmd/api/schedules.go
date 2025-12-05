package main

import (
	"context"
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

	ctx := r.Context()

	// Check if restaurant exists and user has access to it
	restaurant, err := app.store.Restaurants.GetByID(ctx, restaurantID)
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

	schedules, err := app.store.Schedules.ListByRestaurant(ctx, restaurantID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Cache individual schedules if cacheStorage is available
	if app.config.redisCfg.enabled && app.cacheStorage.Schedules != nil {
		for _, schedule := range schedules {
			// Skip nil schedules
			if schedule == nil {
				continue
			}
			
			if err := app.cacheStorage.Schedules.Set(ctx, schedule); err != nil {
				app.logger.Warnw("failed to cache schedule", "schedule_id", schedule.ID, "error", err)
			}
		}
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
		StartDate:    store.DateOnly(payload.StartDate),
		EndDate:      store.DateOnly(payload.EndDate),
	}

	if err := app.store.Schedules.Create(r.Context(), schedule); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// After creating a schedule, we should cache it
	if app.config.redisCfg.enabled && app.cacheStorage.Schedules != nil {
		if err := app.cacheStorage.Schedules.Set(r.Context(), schedule); err != nil {
			app.logger.Warnw("failed to cache new schedule", "schedule_id", schedule.ID, "error", err)
		}
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

	ctx := r.Context()

	// Try to get from cache first if cacheStorage is available
	if app.config.redisCfg.enabled && app.cacheStorage.Schedules != nil {
		cachedSchedule, err := app.cacheStorage.Schedules.Get(ctx, scheduleID)
		if err == nil && cachedSchedule != nil {
			// Verify restaurant ownership
			if cachedSchedule.RestaurantID == restaurantID {
				// Verify user has access
				user := getUserFromContext(r)
				restaurant, err := app.store.Restaurants.GetByID(ctx, restaurantID)
				if err == nil && restaurant.UserID == user.ID {
					app.logger.Debugw("cache hit for schedule", "schedule_id", scheduleID)
					err = app.jsonResponse(w, http.StatusOK, cachedSchedule)
					if err != nil {
						app.internalServerError(w, r, err)
					}
					return
				}
			}
		}
	}

	// Cache miss or validation failed - get from database
	// Check if restaurant exists and user has access to it
	restaurant, err := app.store.Restaurants.GetByID(ctx, restaurantID)
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
	schedule, err := app.store.Schedules.GetByID(ctx, scheduleID)
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

	// Cache for future requests if cacheStorage is available
	if app.config.redisCfg.enabled && app.cacheStorage.Schedules != nil {
		if err := app.cacheStorage.Schedules.Set(ctx, schedule); err != nil {
			app.logger.Warnw("failed to cache schedule", "schedule_id", scheduleID, "error", err)
		} else {
			app.logger.Debugw("cached schedule", "schedule_id", scheduleID)
		}
	}

	err = app.jsonResponse(w, http.StatusOK, schedule)
	if err != nil {
		app.internalServerError(w, r, err)
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
		startDate = store.DateOnly(*payload.StartDate)
	}

	if payload.EndDate != nil {
		// Validate date format
		_, err := time.Parse("2006-01-02", *payload.EndDate)
		if err != nil {
			app.badRequestResponse(w, r, errors.New("invalid end date format, use YYYY-MM-DD"))
			return
		}
		endDate = store.DateOnly(*payload.EndDate)
	}

	// Ensure end date is after or equal to start date
	startDateParsed, _ := time.Parse("2006-01-02", string(startDate))
	endDateParsed, _ := time.Parse("2006-01-02", string(endDate))
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

	// After updating, update the cache as well
	if app.config.redisCfg.enabled && app.cacheStorage.Schedules != nil {
		if err := app.cacheStorage.Schedules.Set(r.Context(), schedule); err != nil {
			app.logger.Warnw("failed to update schedule in cache", "schedule_id", schedule.ID, "error", err)
		}
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

	// Delete from cache as well if Redis is enabled
	if app.config.redisCfg.enabled && app.cacheStorage.Schedules != nil {
		// Use type assertion to access the Delete method
		if scheduleStore, ok := app.cacheStorage.Schedules.(interface{ Delete(context.Context, int64) error }); ok {
			if err := scheduleStore.Delete(r.Context(), scheduleID); err != nil {
				app.logger.Warnw("failed to delete schedule from cache", "schedule_id", scheduleID, "error", err)
			}
		}
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

	// Update schedule in cache after publishing
	if app.config.redisCfg.enabled && app.cacheStorage.Schedules != nil {
		// Need to fetch the updated schedule with the published timestamp
		updatedSchedule, err := app.store.Schedules.GetByID(r.Context(), scheduleID)
		if err == nil {
			if err := app.cacheStorage.Schedules.Set(r.Context(), updatedSchedule); err != nil {
				app.logger.Warnw("failed to update published schedule in cache", "schedule_id", scheduleID, "error", err)
			}
		} else {
			app.logger.Warnw("could not fetch updated schedule for cache", "schedule_id", scheduleID, "error", err)
		}
	}

	w.WriteHeader(http.StatusNoContent)
}
