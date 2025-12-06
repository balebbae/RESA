package main

import (
	"context"
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

type ResendConfirmationPayload struct {
	Email string `json:"email" validate:"required,email,max=255"`
}

// ResendConfirmationHandler godoc
//
//	@Summary		Resends confirmation email
//	@Description	Resends the confirmation email to an inactive user
//	@Tags			authentication
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		ResendConfirmationPayload	true	"User email"
//	@Success		200		{object}	map[string]string			"Success message"
//	@Failure		400		{object}	error
//	@Failure		500		{object}	error
//	@Router			/authentication/resend-confirmation [post]
func (app *application) resendConfirmationHandler(w http.ResponseWriter, r *http.Request) {
	var payload ResendConfirmationPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Generate new activation token
	plainToken := uuid.New().String()

	// Hash token for database storage
	hash := sha256.Sum256([]byte(plainToken))
	hashToken := hex.EncodeToString(hash[:])

	// Resend invitation (creates new token, deletes old one)
	user, err := app.store.Users.ResendInvitation(ctx, payload.Email, hashToken, app.config.mail.exp)
	if err != nil {
		// Don't reveal if user exists or is already active (security best practice)
		// Just return generic success message
		app.logger.Infow("Resend confirmation failed", "email", payload.Email, "error", err)
		if err := app.jsonResponse(w, http.StatusOK, map[string]string{
			"message": "If an account with that email exists and is not yet activated, a confirmation email has been sent.",
		}); err != nil {
			app.internalServerError(w, r, err)
		}
		return
	}

	// Build activation URL
	activationURL := fmt.Sprintf("%s/confirm/%s", app.config.frontendURL, plainToken)

	isProdEnv := app.config.env == "production"
	vars := struct {
		FirstName     string
		ActivationURL string
	}{
		FirstName:     user.FirstName,
		ActivationURL: activationURL,
	}

	// Send email
	status, err := app.mailer.Send(mailer.UserWelcomeTemplate, user.FirstName, user.Email, vars, !isProdEnv)
	if err != nil {
		app.logger.Errorw("error sending confirmation email", "error", err)
		app.internalServerError(w, r, err)
		return
	}
	app.logger.Infow("Confirmation email resent", "status code", status, "email", user.Email)

	if err := app.jsonResponse(w, http.StatusOK, map[string]string{
		"message": "Confirmation email has been sent. Please check your inbox.",
	}); err != nil {
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

type GoogleLoginResponse struct {
	AuthURL string `json:"auth_url"`
	State   string `json:"state"`
}

// googleLoginHandler godoc
//
//	@Summary		Initiates Google OAuth login
//	@Description	Generates and returns the Google OAuth authorization URL
//	@Tags			authentication
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	GoogleLoginResponse	"OAuth URL and state token"
//	@Failure		500	{object}	error
//	@Router			/authentication/google [post]
func (app *application) googleLoginHandler(w http.ResponseWriter, r *http.Request) {
	// Generate state token for CSRF protection
	state := uuid.New().String()

	// Get OAuth authorization URL
	authURL := app.oauthProvider.GetAuthURL(state)

	response := GoogleLoginResponse{
		AuthURL: authURL,
		State:   state,
	}

	app.logger.Infow("Google OAuth initiated", "state", state)

	if err := app.jsonResponse(w, http.StatusOK, response); err != nil {
		app.internalServerError(w, r, err)
	}
}

type GoogleCallbackPayload struct {
	Code  string `json:"code" validate:"required"`
	State string `json:"state" validate:"required"`
}

// googleCallbackHandler godoc
//
//	@Summary		Handles Google OAuth callback
//	@Description	Exchanges authorization code for user info and creates/authenticates user
//	@Tags			authentication
//	@Accept			json
//	@Produce		json
//	@Param			payload	body		GoogleCallbackPayload	true	"OAuth callback data"
//	@Success		200		{string}	string					"JWT token"
//	@Failure		400		{object}	error
//	@Failure		401		{object}	error
//	@Failure		500		{object}	error
//	@Router			/authentication/google/callback [post]
func (app *application) googleCallbackHandler(w http.ResponseWriter, r *http.Request) {
	var payload GoogleCallbackPayload
	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	// Exchange code for Google user info
	googleUser, err := app.oauthProvider.ExchangeCode(ctx, payload.Code)
	if err != nil {
		app.logger.Errorw("failed to exchange OAuth code", "error", err)
		app.unauthorizedErrorResponse(w, r, fmt.Errorf("failed to authenticate with Google"))
		return
	}

	app.logger.Infow("Google user info retrieved", "email", googleUser.Email, "google_id", googleUser.ID)

	// Try to find user by Google ID first
	user, err := app.store.Users.GetByGoogleID(ctx, googleUser.ID)
	if err == nil {
		// Existing Google user - generate token and return
		app.logger.Infow("Existing Google user logged in", "user_id", user.ID)
		token, err := app.generateTokenForUser(user)
		if err != nil {
			app.internalServerError(w, r, err)
			return
		}

		if err := app.jsonResponse(w, http.StatusOK, token); err != nil {
			app.internalServerError(w, r, err)
		}
		return
	}

	// User not found by Google ID, try to find by email (for account linking)
	if err != store.ErrNotFound {
		app.internalServerError(w, r, err)
		return
	}

	user, err = app.store.Users.GetByEmailIncludingInactive(ctx, googleUser.Email)
	if err == nil {
		// User exists with this email - link Google account
		app.logger.Infow("Linking Google account to existing user", "user_id", user.ID, "email", user.Email)

		err = app.store.Users.LinkGoogleAccount(ctx, user.ID, googleUser.ID, googleUser.Picture)
		if err != nil {
			app.logger.Errorw("failed to link Google account", "error", err)
			app.internalServerError(w, r, err)
			return
		}

		// Update user struct with new info
		user.GoogleID = &googleUser.ID
		user.AvatarURL = &googleUser.Picture

		token, err := app.generateTokenForUser(user)
		if err != nil {
			app.internalServerError(w, r, err)
			return
		}

		if err := app.jsonResponse(w, http.StatusOK, token); err != nil {
			app.internalServerError(w, r, err)
		}
		return
	}

	// User doesn't exist - create new user with Google OAuth
	if err != store.ErrNotFound {
		app.internalServerError(w, r, err)
		return
	}

	app.logger.Infow("Creating new user with Google OAuth", "email", googleUser.Email)

	newUser := &store.User{
		Email:     googleUser.Email,
		FirstName: googleUser.GivenName,
		LastName:  googleUser.FamilyName,
	}

	// Create user with Google OAuth (handles transaction internally)
	err = app.createUserWithGoogle(ctx, newUser, googleUser.ID, googleUser.Picture)
	if err != nil {
		app.logger.Errorw("failed to create user with Google", "error", err)
		switch err {
		case store.ErrDuplicateEmail:
			app.badRequestResponse(w, r, err)
		default:
			app.internalServerError(w, r, err)
		}
		return
	}

	app.logger.Infow("New user created with Google OAuth", "user_id", newUser.ID, "email", newUser.Email)

	token, err := app.generateTokenForUser(newUser)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, token); err != nil {
		app.internalServerError(w, r, err)
	}
}

// generateTokenForUser is a helper function to generate JWT token for a user
func (app *application) generateTokenForUser(user *store.User) (string, error) {
	claims := jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(app.config.auth.token.exp).Unix(),
		"iat": time.Now().Unix(),
		"nbf": time.Now().Unix(),
		"iss": app.config.auth.token.iss,
		"aud": app.config.auth.token.iss,
	}

	return app.authenticator.GenerateToken(claims)
}

// createUserWithGoogle is a helper function to create a user with Google OAuth
func (app *application) createUserWithGoogle(ctx context.Context, user *store.User, googleID, avatarURL string) error {
	return app.store.Users.CreateUserWithGoogle(ctx, user, googleID, avatarURL)
}