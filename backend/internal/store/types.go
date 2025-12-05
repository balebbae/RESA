package store

import (
	"database/sql/driver"
	"fmt"
	"time"
)

// TimeOfDay represents a time-of-day (HH:MM:SS) without date component.
// Handles the pq driver quirk where PostgreSQL TIME columns are scanned
// as RFC3339 timestamps (e.g., "0000-01-01T14:30:00Z").
//
// Usage:
//   - Use in structs for PostgreSQL TIME columns
//   - Automatically normalizes on database reads via sql.Scanner
//   - Serializes to JSON as "HH:MM:SS" string
type TimeOfDay string

// Scan implements sql.Scanner for automatic normalization on database reads.
// This handles the pq driver behavior where TIME columns are returned as
// RFC3339 timestamps like "0000-01-01T14:30:00Z".
func (t *TimeOfDay) Scan(src interface{}) error {
	if src == nil {
		*t = ""
		return nil
	}

	var str string
	switch v := src.(type) {
	case string:
		str = v
	case []byte:
		str = string(v)
	case time.Time:
		// Handle case where pq might return actual time.Time
		str = v.Format("15:04:05")
	default:
		return fmt.Errorf("TimeOfDay.Scan: unsupported type %T", src)
	}

	// Normalize the scanned value using the existing helper
	*t = TimeOfDay(normalizeTimeString(str))
	return nil
}

// Value implements driver.Valuer for database writes.
// Returns the time string as-is for PostgreSQL TIME column insertion.
func (t TimeOfDay) Value() (driver.Value, error) {
	if t == "" {
		return nil, nil
	}
	return string(t), nil
}

// String returns the time as a string.
func (t TimeOfDay) String() string {
	return string(t)
}

// DateOnly represents a date (YYYY-MM-DD) without time component.
// Provides consistent handling of PostgreSQL DATE columns across the application.
//
// Usage:
//   - Use in structs for PostgreSQL DATE columns
//   - Automatically normalizes on database reads via sql.Scanner
//   - Serializes to JSON as "YYYY-MM-DD" string
type DateOnly string

// Scan implements sql.Scanner for consistent DATE column handling.
// Normalizes various input formats to YYYY-MM-DD.
func (d *DateOnly) Scan(src interface{}) error {
	if src == nil {
		*d = ""
		return nil
	}

	switch v := src.(type) {
	case time.Time:
		*d = DateOnly(v.Format("2006-01-02"))
	case string:
		*d = DateOnly(normalizeDateString(v))
	case []byte:
		*d = DateOnly(normalizeDateString(string(v)))
	default:
		return fmt.Errorf("DateOnly.Scan: unsupported type %T", src)
	}
	return nil
}

// Value implements driver.Valuer for database writes.
// Returns the date string as-is for PostgreSQL DATE column insertion.
func (d DateOnly) Value() (driver.Value, error) {
	if d == "" {
		return nil, nil
	}
	return string(d), nil
}

// String returns the date as a string.
func (d DateOnly) String() string {
	return string(d)
}

// ToTime converts DateOnly to time.Time (at midnight UTC).
// Returns an error if the date string cannot be parsed.
func (d DateOnly) ToTime() (time.Time, error) {
	if d == "" {
		return time.Time{}, nil
	}
	return time.Parse("2006-01-02", string(d))
}

// normalizeDateString converts various date formats to YYYY-MM-DD format.
// Handles RFC3339 timestamps, date-only strings, and other common formats.
func normalizeDateString(dateStr string) string {
	// If already in YYYY-MM-DD format, return as-is
	if len(dateStr) == 10 && dateStr[4] == '-' && dateStr[7] == '-' {
		return dateStr
	}

	// Try parsing as RFC3339/ISO8601 timestamp
	if t, err := time.Parse(time.RFC3339, dateStr); err == nil {
		return t.Format("2006-01-02")
	}

	// Try other common date formats
	formats := []string{
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05",
		"2006-01-02",
		"01/02/2006",
		"02-01-2006",
	}
	for _, format := range formats {
		if t, err := time.Parse(format, dateStr); err == nil {
			return t.Format("2006-01-02")
		}
	}

	// If all parsing fails, return as-is
	return dateStr
}
