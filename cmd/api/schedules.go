package main

import (
	"net/http"
	"time"
)

type CreateSchedulePayload struct {
	StartDate time.Time `json:"start_date" validate:"required"`
	EndDate   time.Time `json:"end_date"   validate:"required,gtfield=StartDate"`
}


func (app *application) getSchedulesHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) createScheduleHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) getScheduleHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) updateScheduleHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) deleteScheduleHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) publishScheduleHandler(w http.ResponseWriter, r *http.Request) {

}
