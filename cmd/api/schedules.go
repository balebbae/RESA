package main

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/balebbae/RESA/internal/mailer"
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

// SendScheduleEmailPayload defines the request body for sending schedule emails
type SendScheduleEmailPayload struct {
	IncludeEvents bool `json:"include_events"`
}

// SendScheduleEmailResponse defines the response structure
type SendScheduleEmailResponse struct {
	TotalRecipients int                        `json:"total_recipients"`
	Successful      int                        `json:"successful"`
	Failed          int                        `json:"failed"`
	Failures        []SendScheduleEmailFailure `json:"failures,omitempty"`
}

// SendScheduleEmailFailure describes a single email send failure
type SendScheduleEmailFailure struct {
	EmployeeID   int64  `json:"employee_id"`
	EmployeeName string `json:"employee_name"`
	Email        string `json:"email"`
	Error        string `json:"error"`
}

// ScheduleEmailData contains all data needed for the schedule email template
type ScheduleEmailData struct {
	RestaurantName string
	EmployeeName   string
	ScheduleStart  string
	ScheduleEnd    string
	Shifts         []ScheduleEmailShift
	Events         []ScheduleEmailEvent
	HasShifts      bool
	HasEvents      bool
}

// ScheduleEmailShift represents a shift in the email
type ScheduleEmailShift struct {
	Date      string
	StartTime string
	EndTime   string
	RoleName  string
	RoleColor string
	Notes     string
}

// ScheduleEmailEvent represents an event in the email
type ScheduleEmailEvent struct {
	Date        string
	Title       string
	Description string
	StartTime   string
	EndTime     string
}

// formatDateForDisplay formats a DateOnly for human-readable display
func formatDateForDisplay(d store.DateOnly) string {
	t, err := time.Parse("2006-01-02", string(d))
	if err != nil {
		return string(d)
	}
	return t.Format("Mon, Jan 2, 2006")
}

// formatShiftDateForDisplay formats a time.Time for shift display (e.g., "Monday, Jan 2")
func formatShiftDateForDisplay(t time.Time) string {
	return t.Format("Monday, Jan 2")
}

// formatTimeForDisplay formats a TimeOfDay for human-readable display (e.g., "9:00 AM")
func formatTimeForDisplay(t store.TimeOfDay) string {
	parsed, err := time.Parse("15:04:05", string(t))
	if err != nil {
		// Try HH:MM format
		parsed, err = time.Parse("15:04", string(t))
		if err != nil {
			return string(t)
		}
	}
	return parsed.Format("3:04 PM")
}

// filterShiftsForEmployee returns only shifts assigned to the given employee
func filterShiftsForEmployee(shifts []*store.ScheduledShift, employeeID int64) []*store.ScheduledShift {
	var result []*store.ScheduledShift
	for _, shift := range shifts {
		if shift.EmployeeID != nil && *shift.EmployeeID == employeeID {
			result = append(result, shift)
		}
	}
	return result
}

// transformShiftsForEmail converts ScheduledShifts to email-friendly format
func transformShiftsForEmail(shifts []*store.ScheduledShift) []ScheduleEmailShift {
	result := make([]ScheduleEmailShift, 0, len(shifts))
	for _, s := range shifts {
		result = append(result, ScheduleEmailShift{
			Date:      formatShiftDateForDisplay(s.ShiftDate),
			StartTime: formatTimeForDisplay(s.StartTime),
			EndTime:   formatTimeForDisplay(s.EndTime),
			RoleName:  s.RoleName,
			RoleColor: s.RoleColor,
			Notes:     s.Notes,
		})
	}
	return result
}

// transformEventsForEmail converts Events to email-friendly format
func transformEventsForEmail(events []*store.Event) []ScheduleEmailEvent {
	if events == nil {
		return nil
	}
	result := make([]ScheduleEmailEvent, 0, len(events))
	for _, e := range events {
		result = append(result, ScheduleEmailEvent{
			Date:        formatDateForDisplay(e.Date),
			Title:       e.Title,
			Description: e.Description,
			StartTime:   formatTimeForDisplay(e.StartTime),
			EndTime:     formatTimeForDisplay(e.EndTime),
		})
	}
	return result
}

// buildScheduleEmailData builds the email data structure for an employee
func buildScheduleEmailData(
	employee *store.Employee,
	allShifts []*store.ScheduledShift,
	events []*store.Event,
	restaurantName string,
	schedule *store.Schedule,
) *ScheduleEmailData {
	employeeShifts := filterShiftsForEmployee(allShifts, employee.ID)
	emailShifts := transformShiftsForEmail(employeeShifts)
	emailEvents := transformEventsForEmail(events)

	return &ScheduleEmailData{
		RestaurantName: restaurantName,
		EmployeeName:   employee.FullName,
		ScheduleStart:  formatDateForDisplay(schedule.StartDate),
		ScheduleEnd:    formatDateForDisplay(schedule.EndDate),
		Shifts:         emailShifts,
		Events:         emailEvents,
		HasShifts:      len(emailShifts) > 0,
		HasEvents:      len(emailEvents) > 0,
	}
}

// SendScheduleEmail godoc
//
//	@Summary		Sends schedule emails to all employees
//	@Description	Sends the schedule via email to all employees in the restaurant
//	@Tags			schedule
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int							true	"Restaurant ID"
//	@Param			id				path		int							true	"Schedule ID"
//	@Param			payload			body		SendScheduleEmailPayload	true	"Email options"
//	@Success		200				{object}	SendScheduleEmailResponse
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/schedules/{id}/send-email [post]
func (app *application) sendScheduleEmailHandler(w http.ResponseWriter, r *http.Request) {
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

	// Verify restaurant ownership
	restaurant, err := app.store.Restaurants.GetByID(ctx, restaurantID)
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

	// Get and validate schedule
	schedule, err := app.store.Schedules.GetByID(ctx, scheduleID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if schedule.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("schedule not found"))
		return
	}

	// Parse payload (allow empty body, default to include_events: false)
	var payload SendScheduleEmailPayload
	if err := readJSON(w, r, &payload); err != nil {
		payload = SendScheduleEmailPayload{IncludeEvents: false}
	}

	// Gather data
	employees, err := app.store.Employees.ListByRestaurant(ctx, restaurantID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if len(employees) == 0 {
		app.badRequestResponse(w, r, errors.New("no employees to send schedule to"))
		return
	}

	shifts, err := app.store.ScheduledShifts.ListBySchedule(ctx, scheduleID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	var events []*store.Event
	if payload.IncludeEvents {
		events, err = app.store.Events.ListByRestaurantAndDateRange(
			ctx,
			restaurantID,
			schedule.StartDate,
			schedule.EndDate,
		)
		if err != nil {
			app.internalServerError(w, r, err)
			return
		}
	}

	// Send emails
	isProdEnv := app.config.env == "production"
	response := SendScheduleEmailResponse{
		TotalRecipients: len(employees),
		Failures:        []SendScheduleEmailFailure{},
	}

	for _, employee := range employees {
		// Skip employees without email
		if employee.Email == "" {
			response.Failed++
			response.Failures = append(response.Failures, SendScheduleEmailFailure{
				EmployeeID:   employee.ID,
				EmployeeName: employee.FullName,
				Email:        "",
				Error:        "no email address",
			})
			continue
		}

		emailData := buildScheduleEmailData(
			employee,
			shifts,
			events,
			restaurant.Name,
			schedule,
		)

		_, err := app.mailer.Send(
			mailer.ScheduleNotificationTemplate,
			employee.FullName,
			employee.Email,
			emailData,
			!isProdEnv,
		)

		if err != nil {
			app.logger.Warnw("failed to send schedule email",
				"employee_id", employee.ID,
				"email", employee.Email,
				"error", err,
			)
			response.Failed++
			response.Failures = append(response.Failures, SendScheduleEmailFailure{
				EmployeeID:   employee.ID,
				EmployeeName: employee.FullName,
				Email:        employee.Email,
				Error:        err.Error(),
			})
			continue
		}

		response.Successful++
	}

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}
