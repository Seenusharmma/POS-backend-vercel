package handlers

import (
	"context"
	"time"

	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/internal/models"
	"github.com/foodfantasy/backend-go/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

// AdminLogin handles admin login
func AdminLogin(c *fiber.Ctx) error {
	var input models.AdminLoginInput
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("admins")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var admin models.Admin
	err = collection.FindOne(ctx, bson.M{"email": input.Email}).Decode(&admin)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid credentials", nil)
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Login failed", err)
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(input.Password)); err != nil {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Invalid credentials", nil)
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":    admin.ID.Hex(),
		"email": admin.Email,
		"role":  admin.Role,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	})

	t, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to generate token", err)
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Login successful", map[string]interface{}{
		"token": t,
		"admin": map[string]interface{}{
			"id":    admin.ID,
			"name":  admin.Name,
			"email": admin.Email,
			"role":  admin.Role,
		},
	})
}

// AdminRegister handles new admin registration
func AdminRegister(c *fiber.Ctx) error {
	var input models.AdminInput
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("admins")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if already exists
	count, err := collection.CountDocuments(ctx, bson.M{"email": input.Email})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Database error", err)
	}
	if count > 0 {
		return utils.ErrorResponse(c, fiber.StatusConflict, "Email already registered", nil)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to hash password", err)
	}

	admin := models.NewAdmin(input, string(hashedPassword))

	_, err = collection.InsertOne(ctx, admin)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to register admin", err)
	}

	return utils.SuccessResponse(c, fiber.StatusCreated, "Admin registered successfully", nil)
}

// CheckAdminStatus checks if a user is an admin
func CheckAdminStatus(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Email required", nil)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("admins")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := collection.CountDocuments(ctx, bson.M{"email": email})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Database error", err)
	}

	isAdmin := count > 0
	return utils.DataResponse(c, fiber.StatusOK, map[string]bool{
		"isAdmin": isAdmin,
	})
}
