package main

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-chi/chi/v5"
)

type employeeKey string
const employeeCtx employeeKey = "employee"

type CreateEmployeePayload struct {
	FullName     string  `json:"full_name" validate:"required,max=255"`
	Email        string  `json:"email" validate:"required,email,max=255"`
}

type UpdateEmployeePayload struct {
	FullName     *string  `json:"full_name" validate:"omitempty,max=255"`
	Email        *string  `json:"email" validate:"omitempty,email,max=255"`
}

type AddEmployeeRolesPayload struct {
	RoleIDs []int64 `json:"role_ids" validate:"required,dive,gt=0"`
}

// GetEmployees godoc
//
//	@Summary		Lists restaurant's employees
//	@Description	Fetches all employees for a restaurant
//	@Tags			employee
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Success		200				{array}		store.Employee
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/employees [get]
func (app *application) getEmployeesHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
	restaurant, err := app.store.Restaurant.GetByID(r.Context(), restaurantID)
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

	employees, err := app.store.Employee.ListByRestaurant(r.Context(), restaurantID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusOK, employees)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// CreateEmployee godoc
//
//	@Summary		Creates an employee
//	@Description	Creates an employee for a restaurant
//	@Tags			employee
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int						true	"Restaurant ID"
//	@Param			payload			body		CreateEmployeePayload	true	"Employee payload"
//	@Success		201				{object}	store.Employee
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/employees [post]
func (app *application) createEmployeeHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
	restaurant, err := app.store.Restaurant.GetByID(r.Context(), restaurantID)
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

	var payload CreateEmployeePayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Create employee using restaurant ID from URL
	employee := &store.Employee{
		RestaurantID: restaurantID,
		FullName:     payload.FullName,
		Email:        payload.Email,
	}

	if err := app.store.Employee.Create(r.Context(), employee); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusCreated, employee)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetEmployee godoc
//
//	@Summary		Fetches an employee
//	@Description	Fetches an employee by ID
//	@Tags			employee
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Employee ID"
//	@Success		200				{object}	store.Employee
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/employees/{id} [get]
func (app *application) getEmployeeHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	employeeID, err := strconv.ParseInt(chi.URLParam(r, "employeeID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
	restaurant, err := app.store.Restaurant.GetByID(r.Context(), restaurantID)
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

	employee, err := app.store.Employee.GetByID(r.Context(), employeeID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify employee belongs to this restaurant
	if employee.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("employee not found"))
		return
	}

	err = app.jsonResponse(w, http.StatusOK, employee)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// UpdateEmployee godoc
//
//	@Summary		Updates an employee
//	@Description	Updates an employee by ID
//	@Tags			employee
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int						true	"Restaurant ID"
//	@Param			id				path		int						true	"Employee ID"
//	@Param			payload			body		UpdateEmployeePayload	true	"Employee payload"
//	@Success		200				{object}	store.Employee
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/employees/{id} [patch]
func (app *application) updateEmployeeHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	employeeID, err := strconv.ParseInt(chi.URLParam(r, "employeeID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
	restaurant, err := app.store.Restaurant.GetByID(r.Context(), restaurantID)
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

	// Get existing employee
	employee, err := app.store.Employee.GetByID(r.Context(), employeeID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify employee belongs to this restaurant
	if employee.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("employee not found"))
		return
	}

	// Read and validate payload
	var payload UpdateEmployeePayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Update fields if provided
	if payload.FullName != nil {
		employee.FullName = *payload.FullName
	}

	if payload.Email != nil {
		employee.Email = *payload.Email
	}

	// Save updates
	if err := app.store.Employee.Update(r.Context(), employee); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	err = app.jsonResponse(w, http.StatusOK, employee)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// DeleteEmployee godoc
//
//	@Summary		Deletes an employee
//	@Description	Deletes an employee by ID
//	@Tags			employee
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Employee ID"
//	@Success		204				{object}	string
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/employees/{id} [delete]
func (app *application) deleteEmployeeHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	employeeID, err := strconv.ParseInt(chi.URLParam(r, "employeeID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
	restaurant, err := app.store.Restaurant.GetByID(r.Context(), restaurantID)
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

	// Get existing employee
	employee, err := app.store.Employee.GetByID(r.Context(), employeeID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	// Verify employee belongs to this restaurant
	if employee.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("employee not found"))
		return
	}

	// Delete employee
	if err := app.store.Employee.Delete(r.Context(), employeeID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// AddEmployeeRoles godoc
//
//	@Summary		Assigns roles to an employee
//	@Description	Assigns multiple roles to an employee
//	@Tags			employee
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int						true	"Restaurant ID"
//	@Param			id				path		int						true	"Employee ID"
//	@Param			payload			body		AddEmployeeRolesPayload	true	"Role IDs payload"
//	@Success		204				{object}	string
//	@Failure		400				{object}	error
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/employees/{id}/roles [post]
func (app *application) addEmployeeRolesHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	employeeID, err := strconv.ParseInt(chi.URLParam(r, "employeeID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Check if restaurant exists and user has access to it
	restaurant, err := app.store.Restaurant.GetByID(r.Context(), restaurantID)
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

	// Check if employee exists and belongs to this restaurant
	employee, err := app.store.Employee.GetByID(r.Context(), employeeID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if employee.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("employee not found"))
		return
	}

	// Parse and validate payload
	var payload AddEmployeeRolesPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Verify all roles exist and belong to this restaurant
	for _, roleID := range payload.RoleIDs {
		role, err := app.store.Role.GetByID(r.Context(), roleID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				app.badRequestResponse(w, r, errors.New("one or more roles do not exist"))
				return
			}
			app.internalServerError(w, r, err)
			return
		}

		if role.RestaurantID != restaurantID {
			app.badRequestResponse(w, r, errors.New("one or more roles do not belong to this restaurant"))
			return
		}
	}

	// Assign roles to employee
	if err := app.store.Employee.AssignRoles(r.Context(), employeeID, payload.RoleIDs); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RemoveEmployeeRole godoc
//
//	@Summary		Removes a role from an employee
//	@Description	Removes a specific role from an employee
//	@Tags			employee
//	@Accept			json
//	@Produce		json
//	@Param			restaurant_id	path		int	true	"Restaurant ID"
//	@Param			id				path		int	true	"Employee ID"
//	@Param			role_id			path		int	true	"Role ID"
//	@Success		204				{object}	string
//	@Failure		401				{object}	error
//	@Failure		404				{object}	error
//	@Failure		500				{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{restaurant_id}/employees/{id}/roles/{role_id} [delete]
func (app *application) removeEmployeeRoleHandler(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := strconv.ParseInt(chi.URLParam(r, "restaurantID"), 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	employeeID, err := strconv.ParseInt(chi.URLParam(r, "employeeID"), 10, 64)
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
	restaurant, err := app.store.Restaurant.GetByID(r.Context(), restaurantID)
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

	// Check if employee exists and belongs to this restaurant
	employee, err := app.store.Employee.GetByID(r.Context(), employeeID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if employee.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("employee not found"))
		return
	}

	// Check if role exists and belongs to this restaurant
	role, err := app.store.Role.GetByID(r.Context(), roleID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	if role.RestaurantID != restaurantID {
		app.notFoundResponse(w, r, errors.New("role not found"))
		return
	}

	// Remove role from employee
	err = app.store.Employee.RemoveRole(r.Context(), employeeID, roleID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			app.notFoundResponse(w, r, errors.New("employee does not have this role"))
			return
		}
		app.internalServerError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}