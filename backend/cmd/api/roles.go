package main

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-chi/chi/v5"
)

// type roleKey string
// const roleCtx roleKey = "role"
type CreateRolePayload struct {
	Name    string  `json:"name" validate:"required,max=50"`
}

type UpdateRolePayload struct {
	Name    *string  `json:"name" validate:"omitempty,max=50"`
}

// GetRoles godoc
//
//	@Summary		Lists restaurant's roles
//	@Description	Fetches all roles for a restaurant
//	@Tags			role
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Success		200				{array}		store.Role
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/roles [get]
func (app *application) getRolesHandler(w http.ResponseWriter, r *http.Request) {
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

	roles, err := app.store.Roles.ListByRestaurant(r.Context(), restaurantID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusOK, roles)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// CreateRole godoc
//
//	@Summary		Creates a role
//	@Description	Creates a role for a restaurant
//	@Tags			role
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int					true	"Restaurant ID"
//	@Param			payload			body		CreateRolePayload	true	"Role payload"
//	@Success		201				{object}	store.Role
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/roles [post]
func (app *application) createRoleHandler(w http.ResponseWriter, r *http.Request) {
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

	var payload CreateRolePayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	role := &store.Role{
		RestaurantID: restaurantID,
		Name:         payload.Name,
	}

	if err := app.store.Roles.Create(r.Context(), role); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusCreated, role)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetRole godoc
//
//	@Summary		Fetches a role
//	@Description	Fetches a role by ID
//	@Tags			role
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Role ID"
//	@Success		200				{object}	store.Role
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/roles/{id} [get]
func (app *application) getRoleHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	roleID, err := strconv.ParseInt(chi.URLParam(r, "roleID"), 10, 64)
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

	role, err := app.store.Roles.GetByID(r.Context(), roleID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify role belongs to this restaurant
	if role.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("role not found"))
		return
	}

	err = app.jsonResponse(w, http.StatusOK, role)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// UpdateRole godoc
//
//	@Summary		Updates a role
//	@Description	Updates a role by ID
//	@Tags			role
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int					true	"Restaurant ID"
//	@Param			id				path		int					true	"Role ID"
//	@Param			payload			body		UpdateRolePayload	true	"Role payload"
//	@Success		200				{object}	store.Role
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/roles/{id} [patch]
func (app *application) updateRoleHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	roleID, err := strconv.ParseInt(chi.URLParam(r, "roleID"), 10, 64)
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

	// Get existing role
	role, err := app.store.Roles.GetByID(r.Context(), roleID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify role belongs to this restaurant
	if role.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("role not found"))
		return
	}

	// Read and validate payload
	var payload UpdateRolePayload
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
		role.Name = *payload.Name
	}

	// Save updates
	if err := app.store.Roles.Update(r.Context(), role); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusOK, role)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// DeleteRole godoc
//
//	@Summary		Deletes a role
//	@Description	Deletes a role by ID
//	@Tags			role
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Role ID"
//	@Success		204				{object}	string
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/roles/{id} [delete]
func (app *application) deleteRoleHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	roleID, err := strconv.ParseInt(chi.URLParam(r, "roleID"), 10, 64)
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

	// Get existing role
	role, err := app.store.Roles.GetByID(r.Context(), roleID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify role belongs to this restaurant
	if role.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("role not found"))
		return
	}

	// Delete role
	if err := app.store.Roles.Delete(r.Context(), roleID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetRoleEmployees godoc
//
//	@Summary		Get employees for a role
//	@Description	Fetches all employees assigned to a specific role
//	@Tags			role
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Role ID"
//	@Success		200				{array}		store.Employee
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/roles/{id}/employees [get]
func (app *application) getRoleEmployeesHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	roleID, err := strconv.ParseInt(chi.URLParam(r, "roleID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Get user from context
	user := getUserFromContext(r)

	// Verify restaurant ownership
	restaurant, err := app.store.Restaurants.GetByID(r.Context(), restaurantID)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if restaurant.UserID != user.ID {
		app.unauthorizedErrorResponse(w, r, errors.New("not restaurant owner"))
		return
	}

	// Verify role exists and belongs to restaurant
	role, err := app.store.Roles.GetByID(r.Context(), roleID)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	if role.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("role not found in this restaurant"))
		return
	}

	// Fetch employees for role
	employees, err := app.store.Roles.GetEmployees(r.Context(), roleID, restaurantID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, employees); err != nil {
		app.internalServerError(w, r, err)
	}
}