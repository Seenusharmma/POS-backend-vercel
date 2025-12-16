package middleware

import (
	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// CorsMiddleware returns the CORS middleware configuration
func CorsMiddleware() fiber.Handler {
	allowOrigins := config.AppConfig.FrontendURL
	if allowOrigins == "" {
		allowOrigins = "http://localhost:5173,https://foodfantasy-live.vercel.app"
	} else {
		allowOrigins += ",http://localhost:5173,https://foodfantasy-live.vercel.app"
	}

	return cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, x-admin-request, Cache-Control, Pragma, Expires",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	})
}
