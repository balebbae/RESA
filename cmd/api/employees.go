package main

import (
	"net/http"
	"time"
)

type CreateEmployeePayload struct {
	FullName       int64  `json:"full_name" validate:"required,max=255"`
	Email    time.Time  `json:"email" validate:"required,max=255"`
}

func (app *application) getEmployeesHandler(w http.ResponseWriter, r *http.Request) {
	
}

func (app *application) createEmployeeHandler(w http.ResponseWriter, r *http.Request) {

}

func (app *application) getEmployeeHandler(w http.ResponseWriter, r *http.Request) {

}

func (app *application) updateEmployeeHandler(w http.ResponseWriter, r *http.Request) {

}

func (app *application) deleteEmployeeHandler(w http.ResponseWriter, r *http.Request) {

}

func (app *application) addEmployeeRolesHandler(w http.ResponseWriter, r *http.Request) {

}

func (app *application) removeEmployeeRoleHandler(w http.ResponseWriter, r *http.Request) {

}