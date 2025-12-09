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

// type shiftTemplateKey string
// const shiftTemplateCtx shiftTemplateKey = "shiftTemplate"

type CreateShiftTemplatePayload struct {
	Name         string  `json:"name" validate:"required,min=1,max=255"`
	DayOfWeek    int     `json:"day_of_week" validate:"gte=0,lte=6"`
	StartTime    string  `json:"start_time" validate:"required"`
	EndTime      string  `json:"end_time" validate:"required"`
	Notes        string  `json:"notes,omitempty"`
	RoleIDs      []int64 `json:"role_ids,omitempty"`
}

type UpdateShiftTemplatePayload struct {
	Name         *string  `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	DayOfWeek    *int     `json:"day_of_week,omitempty" validate:"omitempty,min=0,max=6"`
	StartTime    *string  `json:"start_time,omitempty" validate:"omitempty"`
	EndTime      *string  `json:"end_time,omitempty" validate:"omitempty"`
	Notes        *string  `json:"notes,omitempty"`
	RoleIDs      []int64  `json:"role_ids,omitempty"`
}

// GetShiftTemplates godoc
//
//	@Summary		Lists restaurant's shift templates
//	@Description	Fetches all shift templates for a restaurant
//	@Tags			shift-template
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Success		200				{array}		store.ShiftTemplate
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/shift-templates [get]
func (app *application) getShiftTemplatesHandler(w http.ResponseWriter, r *http.Request) {
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

	templates, err := app.store.ShiftTemplates.ListByRestaurant(r.Context(), restaurantID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusOK, templates)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// CreateShiftTemplate godoc
//
//	@Summary		Creates a shift template
//	@Description	Creates a shift template for a restaurant
//	@Tags			shift-template
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int							true	"Restaurant ID"
//	@Param			payload			body		CreateShiftTemplatePayload	true	"Shift template payload"
//	@Success		201				{object}	store.ShiftTemplate
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/shift-templates [post]
func (app *application) createShiftTemplateHandler(w http.ResponseWriter, r *http.Request) {
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

	var payload CreateShiftTemplatePayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
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

	// Initialize role_ids to empty slice if not provided
	roleIDs := payload.RoleIDs
	if roleIDs == nil {
		roleIDs = []int64{}
	}

	template := &store.ShiftTemplate{
		RestaurantID: restaurantID,
		Name:         payload.Name,
		DayOfWeek:    payload.DayOfWeek,
		StartTime:    store.TimeOfDay(payload.StartTime),
		EndTime:      store.TimeOfDay(payload.EndTime),
		Notes:        payload.Notes,
		RoleIDs:      roleIDs,
	}

	if err := app.store.ShiftTemplates.Create(r.Context(), template); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusCreated, template)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetShiftTemplate godoc
//
//	@Summary		Fetches a shift template
//	@Description	Fetches a shift template by ID
//	@Tags			shift-template
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Shift Template ID"
//	@Success		200				{object}	store.ShiftTemplate
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/shift-templates/{id} [get]
func (app *application) getShiftTemplateHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	templateID, err := strconv.ParseInt(chi.URLParam(r, "templateID"), 10, 64)
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

	// Get the shift template
	template, err := app.store.ShiftTemplates.GetByID(r.Context(), templateID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify template belongs to this restaurant
	if template.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("shift template not found"))
		return
	}

	// RoleIDs are already populated from GetByID (stored in JSONB column)
	err = app.jsonResponse(w, http.StatusOK, template)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// UpdateShiftTemplate godoc
//
//	@Summary		Updates a shift template
//	@Description	Updates a shift template by ID
//	@Tags			shift-template
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int							true	"Restaurant ID"
//	@Param			id				path		int							true	"Shift Template ID"
//	@Param			payload			body		UpdateShiftTemplatePayload	true	"Shift template payload with optional fields"
//	@Success		200				{object}	store.ShiftTemplate
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/shift-templates/{id} [patch]
func (app *application) updateShiftTemplateHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	templateID, err := strconv.ParseInt(chi.URLParam(r, "templateID"), 10, 64)
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

	// Get existing template
	template, err := app.store.ShiftTemplates.GetByID(r.Context(), templateID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify template belongs to this restaurant
	if template.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("shift template not found"))
		return
	}

	// Read and validate payload
	var payload UpdateShiftTemplatePayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Update fields if provided
	if payload.Name != nil {
		trimmedName := strings.TrimSpace(*payload.Name)
		if trimmedName == "" {
			app.badRequestResponse(w, r, errors.New("name cannot be empty or whitespace only"))
			return
		}
		template.Name = trimmedName
	}

	if payload.DayOfWeek != nil {
		template.DayOfWeek = *payload.DayOfWeek
	}

	// Store original times for validation
	startTime := template.StartTime
	endTime := template.EndTime

	if payload.StartTime != nil {
		// Validate time format
		if _, err := time.Parse("15:04", *payload.StartTime); err != nil {
			app.badRequestResponse(w, r, errors.New("invalid start time format, use 24-hour format (HH:MM)"))
			return
		}
		startTime = store.TimeOfDay(*payload.StartTime)
	}

	if payload.EndTime != nil {
		// Validate time format
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

	// Set validated times
	template.StartTime = startTime
	template.EndTime = endTime

	if payload.Notes != nil {
		template.Notes = *payload.Notes
	}

	// Update role_ids if provided (nil check allows sending empty array to clear roles)
	if payload.RoleIDs != nil {
		template.RoleIDs = payload.RoleIDs
	}
	// If payload.RoleIDs is nil, keep existing template.RoleIDs (already populated from GetByID)

	// Save updates (including role_ids stored as JSONB)
	if err := app.store.ShiftTemplates.Update(r.Context(), template); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusOK, template)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// DeleteShiftTemplate godoc
//
//	@Summary		Deletes a shift template
//	@Description	Deletes a shift template by ID
//	@Tags			shift-template
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Shift Template ID"
//	@Success		204				{object}	string
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/shift-templates/{id} [delete]
func (app *application) deleteShiftTemplateHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	templateID, err := strconv.ParseInt(chi.URLParam(r, "templateID"), 10, 64)
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

	// Get existing template to verify ownership
	template, err := app.store.ShiftTemplates.GetByID(r.Context(), templateID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify template belongs to this restaurant
	if template.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("shift template not found"))
		return
	}

	// Delete template
	if err := app.store.ShiftTemplates.Delete(r.Context(), templateID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetShiftTemplateRoles godoc
//
//	@Summary		Get roles for a shift template
//	@Description	Retrieves all roles associated with a shift template
//	@Tags			shift-template
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Shift Template ID"
//	@Success		200				{array}		store.Role
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/shift-templates/{id}/roles [get]
func (app *application) getShiftTemplateRolesHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	templateID, err := strconv.ParseInt(chi.URLParam(r, "templateID"), 10, 64)
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

	// Get the shift template to verify it belongs to this restaurant
	template, err := app.store.ShiftTemplates.GetByID(r.Context(), templateID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify template belongs to this restaurant
	if template.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("shift template not found"))
		return
	}

	// Fetch full role details for each role_id in the template
	var roles []*store.Role
	for _, roleID := range template.RoleIDs {
		role, err := app.store.Roles.GetByID(r.Context(), roleID)
		if err != nil {
			// Skip roles that may have been deleted
			if errors.Is(err, store.ErrNotFound) {
				continue
			}
			app.internalServerError(w, r, err)
			return
		}
		roles = append(roles, role)
	}

	// Return empty array instead of null if no roles
	if roles == nil {
		roles = []*store.Role{}
	}

	err = app.jsonResponse(w, http.StatusOK, roles)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}