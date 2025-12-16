package middleware

import (
	"log"
	"strings"

	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// Protect middleware ensures the user is authenticated
func Protect(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Not authorized, no token", nil)
	}

	if !strings.HasPrefix(authHeader, "Bearer ") {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Not authorized, invalid token format", nil)
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, utils.ErrUnauthorized
		}
		return []byte(config.AppConfig.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		log.Printf("❌ Token verification failed: %v", err)
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Not authorized, token failed", nil)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Not authorized, invalid claims", nil)
	}

	// Set user ID and role in context for handlers
	c.Locals("userId", claims["id"])
	c.Locals("userRole", claims["role"]) // If role exists in token

	return c.Next()
}

// AdminMiddleware ensures the user has admin role
func Admin(c *fiber.Ctx) error {
	// Check for x-admin-request header (legacy support if needed, but rely on token mostly)
	adminHeader := c.Get("x-admin-request")
	if adminHeader == "true" {
		// Note: Depending on security model, you might want strict token checks here too
		// For now, we follow the token claim check
	}

	// Assuming role is stored in token claims
	role, ok := c.Locals("userRole").(string)
	if !ok || (role != "admin" && role != "superadmin") {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "Not authorized as admin", nil)
	}

	return c.Next()
}
