package utils

import "github.com/gofiber/fiber/v2"

// Response is a standard API response structure
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// SuccessResponse sends a success response
func SuccessResponse(c *fiber.Ctx, status int, message string, data interface{}) error {
	return c.Status(status).JSON(Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// ErrorResponse sends an error response
func ErrorResponse(c *fiber.Ctx, status int, message string, err error) error {
	response := Response{
		Success: false,
		Message: message,
	}

	if err != nil {
		response.Error = err.Error()
	}

	return c.Status(status).JSON(response)
}

// DataResponse sends just data (for compatibility with frontend)
func DataResponse(c *fiber.Ctx, status int, data interface{}) error {
	return c.Status(status).JSON(data)
}
