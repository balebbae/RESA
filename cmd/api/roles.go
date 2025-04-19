package main

import "net/http"

// type roleKey string
// const roleCtx restaurantKey = "role"

type CreateRolePayload struct {
	Name    string  `json:"name" validate:"required,max=50"`
}


func (app *application) getRolesHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) createRoleHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) getRoleHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) updateRoleHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) deleteRoleHandler(w http.ResponseWriter, r *http.Request) {

}