package utils

import "errors"

// Common errors
var (
	ErrInvalidInput       = errors.New("invalid input")
	ErrNotFound           = errors.New("resource not found")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
	ErrDatabaseConnection = errors.New("database connection error")
	ErrDatabaseOperation  = errors.New("database operation failed")
	ErrInternalServer     = errors.New("internal server error")
)
