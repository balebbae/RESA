package main

import "net/http"

type CreateUserPayload struct {
	Email     string `json:"email" validate:"required,max=255,email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Role      string `json:"role"`
}

func (app *application) createUserHandler(w http.ResponseWriter, r *http.Request) {
    
}