package main

import (
	"net/http"
	"time"
)

type CreateScheduledShiftPayload struct {
    ShiftTemplateID *int64 `json:"shift_template_id,omitempty" validate:"omitempty,gt=0"`
	RoleID          *int64 `json:"role_id,omitempty"          validate:"omitempty,gt=0"`
	EmployeeID      *int64 `json:"employee_id,omitempty"      validate:"omitempty,gt=0"`

	ShiftDate time.Time `json:"shift_date" validate:"required"`
	StartTime time.Time `json:"start_time" validate:"required"`
	EndTime   time.Time `json:"end_time"   validate:"required,gtfield=StartTime"`
}


func (app *application) getScheduledShiftsHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) createScheduledShiftHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) getScheduledShiftHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) updateScheduledShiftHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) deleteScheduledShiftHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) assignEmployeeToShiftHandler(w http.ResponseWriter, r *http.Request) {

}
func (app *application) unassignEmployeeFromShiftHandler(w http.ResponseWriter, r *http.Request) {

}