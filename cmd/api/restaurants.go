package main

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/balebbae/RESA/internal/store"
	"github.com/go-chi/chi/v5"
)

type restaurantKey string
const restaurantCtx restaurantKey = "restaurant"


type CreateRestaurantPayload struct {
	Name       string  `json:"name" validate:"required,max=255"`
	Address    string  `json:"address" validate:"required,max=500"`
	Phone      *string `json:"phone,omitempty" validate:"omitempty,max=20"`
}

// CreatePost godoc
//
//	@Summary		Creates a Restaurant
//	@Description	Creates a Restaurant
//	@Tags			restaurant
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		CreateRestaurantPayload	true	"Restaurant payload"
//	@Success		201		{object}	store.Restaurant
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants [post]
func (app *application) createRestaurantHandler(w http.ResponseWriter, r *http.Request) {
	var payload CreateRestaurantPayload

	// Read JSON payload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// Validate input using go-playground/validator
	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	user := getUserFromContext(r)

	// Construct `Rest` struct for DB insertion
	restaurant := &store.Restaurant{
		Name:       payload.Name,
		Address:    payload.Address,
		Phone:      payload.Phone,
		UserID: user.ID,
	}

	ctx := r.Context()

	// Insert into DB
	err := app.store.Restaurants.Create(ctx, restaurant)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Cache the newly created restaurant
	if app.config.redisCfg.enabled && app.cacheStorage.Restaurants != nil {
		if err := app.cacheStorage.Restaurants.Set(ctx, restaurant); err != nil {
			app.logger.Warnw("failed to cache new restaurant", "restaurant_id", restaurant.ID, "error", err)
		}
	}

	// Send JSON response
	if err = app.jsonResponse(w, http.StatusCreated, restaurant); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

// GetRestaurant godoc
//
//	@Summary		Fetches a Restaurant
//	@Tags			restaurant
//	@Description	Fetches a Restaurant by ID
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Restaurant ID"
//	@Success		200	{object}	store.Restaurant
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{id} [get]
func (app *application) getRestaurantHandler(w http.ResponseWriter, r *http.Request) {
	restaurant := getRestaurantFromContext(r)
	restaurantID := restaurant.ID
	ctx := r.Context()

	// Add debug info to investigate cache issues
	app.logger.Debugw("Restaurant handler cache check", 
		"redisCfg.enabled", app.config.redisCfg.enabled,
		"cacheStorage.Restaurants is nil", app.cacheStorage.Restaurants == nil)

	// Try to get from cache first if available
	if app.config.redisCfg.enabled && app.cacheStorage.Restaurants != nil {
		fmt.Println("Passes this condition")
		app.logger.Debugw("trying to get from cache", "restaurant_id", restaurantID)
		cachedRestaurant, err := app.cacheStorage.Restaurants.Get(ctx, restaurantID)
		app.logger.Debugw("cache result", "err", err, "found", cachedRestaurant != nil)
		if err == nil && cachedRestaurant != nil {
			// Verify user ownership
			user := getUserFromContext(r)
			app.logger.Debugw("checking user ownership", 
				"cachedRestaurant.UserID", cachedRestaurant.UserID, 
				"user.ID", user.ID,
				"match", cachedRestaurant.UserID == user.ID)
			if cachedRestaurant.UserID == user.ID {
				app.logger.Debugw("cache hit for restaurant", "restaurant_id", restaurantID)
				fmt.Println("CACHE HIT")
				err = app.jsonResponse(w, http.StatusOK, cachedRestaurant)
				if err != nil {
					app.internalServerError(w, r, err)
				}
				return
			}
		}
	}

	// Cache miss or validation failed - get from database
	_, err := app.store.Restaurants.GetByID(ctx, restaurant.ID)
	if err != nil {
		app.internalServerError(w, r, err)
		return 
	}

	// Cache for future requests if cacheStorage is available
	if app.config.redisCfg.enabled && app.cacheStorage.Restaurants != nil {
		if err := app.cacheStorage.Restaurants.Set(ctx, restaurant); err != nil {
			app.logger.Warnw("failed to cache restaurant", "restaurant_id", restaurantID, "error", err)
		} else {
			app.logger.Debugw("cached restaurant", "restaurant_id", restaurantID)
		}
	}

	err = app.jsonResponse(w, http.StatusOK, restaurant)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}

type UpdateRestaurantPayload struct {
	Name *string `json:"name" validate:"omitempty,max=255"`
	Address *string `json:"address" validate:"omitempty,max=255"`
	Phone *string `json:"phone" validate:"omitempty,max=20"`
}

// UpdateRestaurant godoc
//
//	@Summary		Updates a Restaurant
//	@Description	Updates a Restaurant by ID
//	@Tags			restaurant
//	@Accept			json
//	@Produce		json
//	@Param			id		path		int						true	"Restaurant ID"
//	@Param			payload	body		UpdateRestaurantPayload	true	"Restaurant payload"
//	@Success		200		{object}	store.Restaurant
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		404		{object}	error
//	@Failure		500		{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{id} [patch]
func (app *application) updateRestaurantHandler(w http.ResponseWriter, r *http.Request) {
	restaurant := getRestaurantFromContext(r)

	var payload UpdateRestaurantPayload
	err := readJSON(w, r, &payload)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	err = Validate.Struct(payload)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if payload.Name != nil {
		restaurant.Name = *payload.Name
	}

	if payload.Address != nil {
		restaurant.Address = *payload.Address
	}

	if payload.Phone != nil {
		restaurant.Phone = payload.Phone
	} else {
		restaurant.Phone = nil
	}

	err = app.store.Restaurants.Update(r.Context(), restaurant)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Update the restaurant in cache
	if app.config.redisCfg.enabled && app.cacheStorage.Restaurants != nil {
		if err := app.cacheStorage.Restaurants.Set(r.Context(), restaurant); err != nil {
			app.logger.Warnw("failed to update restaurant in cache", "restaurant_id", restaurant.ID, "error", err)
		}
	}

	err = app.jsonResponse(w, http.StatusOK, restaurant)
	if err != nil {
		app.internalServerError(w, r, err)
	}
}

// DeleteRestaurant godoc
//
//	@Summary		Deletes a Restaurant
//	@Description	Delete a Restaurant by ID
//	@Tags			restaurant
//	@Accept			json
//	@Produce		json
//	@Param			id	path		int	true	"Restaurant ID"
//	@Success		204	{object}	string
//	@Failure		404	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants/{id} [delete]
func (app *application) deleteRestaurantHandler(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "restaurantID")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Delete from cache before deleting from database
	if app.config.redisCfg.enabled && app.cacheStorage.Restaurants != nil {
		err := app.cacheStorage.Restaurants.Delete(ctx, id)
		if err != nil {
			app.logger.Warnw("failed to delete restaurant from cache", "restaurant_id", id, "error", err)
		} else {
			app.logger.Debugw("deleted restaurant from cache", "restaurant_id", id)
		}
	}

	err = app.store.Restaurants.Delete(ctx, id)
	if err != nil {
		switch {
		case errors.Is(err, store.ErrNotFound):
			app.notFoundResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetRestaurants godoc
//
//	@Summary		Lists user's restaurants
//	@Description	Fetches all restaurants belonging to the authenticated user
//	@Tags			restaurant
//	@Accept			json
//	@Produce		json
//	@Success		200	{array}		store.Restaurant
//	@Failure		401	{object}	error
//	@Failure		500	{object}	error
//	@Security		ApiKeyAuth
//	@Router			/restaurants [get]
func (app *application) getRestaurantsHandler(w http.ResponseWriter, r *http.Request) {
	user := getUserFromContext(r)
	ctx := r.Context()

	restaurants, err := app.store.Restaurants.ListByUser(ctx, user.ID)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	// Skip caching entirely rather than risk nil pointer dereference
	if app.config.redisCfg.enabled && app.cacheStorage.Restaurants != nil {
		for _, restaurant := range restaurants {
			// Skip nil restaurants
			if restaurant == nil {
				continue
			}
			
			if err := app.cacheStorage.Restaurants.Set(ctx, restaurant); err != nil {
				app.logger.Warnw("failed to cache restaurant", "restaurant_id", restaurant.ID, "error", err)
			}
		}
	}

	err = app.jsonResponse(w, http.StatusOK, restaurants)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}
}