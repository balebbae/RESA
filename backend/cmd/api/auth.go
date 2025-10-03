package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"github.com/balebbae/RESA/internal/mailer"
	"github.com/balebbae/RESA/internal/store"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type RegisterUserPayload struct {
	Email string `json:"email" validate:"required,email,max=255"`
	FirstName string `json:"first_name" validate:"required,max=255"`
	LastName string `json:"last_name" validate:"required,max=255"`
	Password string `json:"password" validate:"required,min=3,max=72"`
}

type UserWithToken struct {
	*store.User
	Token  string `json:"token"`
}

// RegisterUserHandler godoc
// 
//	@Summary		Registers a user
//	@Description	Registers a user
//	@Tags			authentication
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		RegisterUserPayload	true	"User credentials"
//	@Success		201		{object}	UserWithToken		"User registered"
//	@Failure		400		{object}	error
//	@Failure		500		{object}	error
//	@Router			/authentication/user [post]
func (app *application) registerUserHandler(w http.ResponseWriter, r *http.Request) {
	var payload RegisterUserPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return 
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	user := &store.User{
		Email: payload.Email,
		FirstName: payload.FirstName,
		LastName: payload.LastName,
	}

	// Hash the user password
	if err := user.Password.Set(payload.Password); err != nil {
		app.internalServerError(w, r, err)
		return 
	}

	ctx := r.Context()

	plainToken := uuid.New().String()
	
	// Store token in DB encrypted 
	hash := sha256.Sum256([]byte(plainToken))
	hashToken := hex.EncodeToString(hash[:])

	// Store the user
	err := app.store.Users.CreateAndInvite(ctx, user, hashToken, app.config.mail.exp)
	if err != nil {
		switch err {
		case store.ErrDuplicateEmail:
			app.badRequestResponse(w, r, err)
		case store.ErrDuplicateUsername:
			app.badRequestResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return 
	}

	userWithToken := UserWithToken{
		User: user,
		Token: plainToken,
	}
	activationURL := fmt.Sprintf("%s/confirm/%s", app.config.frontendURL, plainToken)

	isProdEnv := app.config.env == "production"
	vars := struct{
		FirstName string 
		ActivationURL string
	} {
		FirstName: user.FirstName,
		ActivationURL: activationURL,
	}

	// Send mail
	// TODO:: Make async to scale to many users 
	status, err := app.mailer.Send(mailer.UserWelcomeTemplate, user.FirstName, user.Email, vars, !isProdEnv)
	if err != nil {
		app.logger.Errorw("error sending welcome email", "error", err)

		// rollback user creation if email fails (SAGA Pattern)
		if err := app.store.Users.Delete(ctx, user.ID); err != nil {
			app.logger.Errorw("error deleting user", "error", err)
		}

		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infow("Email sent", "status code", status)

	if err := app.jsonResponse(w, http.StatusCreated, userWithToken); err != nil {
		app.internalServerError(w, r, err)
	}
}

type CreateUserTokenPayload struct {
	Email string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,min=3,max=72"`
}


// createTokenHandler godoc
// 
//	@Summary		Creates a token
//	@Description	creates a token for a user
//	@Tags			authentication
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		CreateUserTokenPayload	true	"User credentials"
//	@Success		200		{string}	string					"Token"
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		500		{object}	error
//	@Router			/authentication/token [post]
func (app *application) createTokenHandler(w http.ResponseWriter, r *http.Request) {
	// parse payload credentials
	var payload CreateUserTokenPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return 
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	// fetch the user (check if the user exists) from the payload
	user, err := app.store.Users.GetByEmail(r.Context(), payload.Email)
	if err != nil {
		switch err {
		case store.ErrNotFound:
			app.unauthorizedErrorResponse(w, r, err) // <= dont tell them not found to prevent enumeration attacks
		default:
			app.internalServerError(w, r, err)
		}
		return
	} // User now exists

	if err := user.Password.Compare(payload.Password); err != nil {
		app.unauthorizedErrorResponse(w, r, err)
		return
	}

	// generate the token -> add claims
	claims := jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(app.config.auth.token.exp).Unix(),
		"iat": time.Now().Unix(),
		"nbf": time.Now().Unix(),
		"iss": app.config.auth.token.iss,
		"aud": app.config.auth.token.iss,
	}

	// TODO:: set a cookie for the frontend to consume
	token, err := app.authenticator.GenerateToken(claims)
	if err != nil {
		app.internalServerError(w, r, err)
		return 
	}

	// send it to the client
	if err := app.jsonResponse(w, http.StatusCreated, token); err != nil {
		app.internalServerError(w, r, err)
	}
}

// refreshTokenHandler godoc
// 
//	@Summary		Refreshes an authentication token
//	@Description	Creates a new token with a fresh expiry time using an existing valid token
//	@Tags			authentication
//	@Accept			json
//	@Produce		json
//	@Security		ApiKeyAuth
//	@Success		200	{string}	string	"New token"
//	@Failure		401	{object}	error	"Unauthorized - invalid or expired token"
//	@Failure		500	{object}	error	"Internal server error"
//	@Router			/authentication/refresh [post]
func (app *application) refreshTokenHandler(w http.ResponseWriter, r *http.Request) {
	// Get the current token from the Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || len(authHeader) < 8 || authHeader[:7] != "Bearer " {
		app.logger.Errorw("invalid authorization header format", "header", authHeader)
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("invalid or missing authentication token"))
		return
	}

	tokenString := authHeader[7:]
	app.logger.Debugw("token received for refresh", "token_length", len(tokenString))

	// Parse and validate the token
	token, err := app.authenticator.ValidateToken(tokenString)
	if err != nil {
		app.logger.Errorw("token validation failed", "error", err)
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("invalid token: %w", err))
		return
	}

	// Verify the token is valid
	if !token.Valid {
		app.logger.Errorw("token marked as invalid")
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("invalid token"))
		return
	}

	// Extract claims from token
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		app.logger.Errorw("failed to extract token claims")
		app.internalServerError(w, r, fmt.Errorf("unable to extract token claims"))
		return
	}

	// Get user ID from claims
	userID, ok := claims["sub"]
	if !ok {
		app.logger.Errorw("missing subject claim in token")
		app.internalServerError(w, r, fmt.Errorf("missing subject claim"))
		return
	}

	// Create new token with fresh expiry
	newClaims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(app.config.auth.token.exp).Unix(),
		"iat": time.Now().Unix(),
		"nbf": time.Now().Unix(),
		"iss": app.config.auth.token.iss,
		"aud": app.config.auth.token.iss,
	}

	// Generate new token
	newToken, err := app.authenticator.GenerateToken(newClaims)
	if err != nil {
		app.logger.Errorw("failed to generate new token", "error", err)
		app.internalServerError(w, r, err)
		return
	}

	app.logger.Infow("token refreshed successfully", "user_id", userID)

	// Return the new token
	if err := app.jsonResponse(w, http.StatusOK, newToken); err != nil {
		app.internalServerError(w, r, err)
	}
}