package main

import (
	"net/http"
	"time"
)

type CreateShiftTemplatePayload struct {
	RoleID       int64  `json:"role_id" validate:"required,gt=0"`
	DayOfWeek       int64  `json:"day_of_week" validate:"required,min=0,max=6"`
	StartTime       time.Time  `json:"start_time" validate:"required"`
	EndTime       time.Time  `json:"end_time" validate:"required,gtfield=StartTime"`
}

func (app *application) getShiftTemplatesHandler(w http.ResponseWriter, r *http.Request) {
	
}
func (app *application) createShiftTemplateHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) getShiftTemplateHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) updateShiftTemplateHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) deleteShiftTemplateHandler(w http.ResponseWriter, r *http.Request) {

}