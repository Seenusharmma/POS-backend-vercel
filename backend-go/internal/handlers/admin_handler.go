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

	var admin models.Admin
	err = collection.FindOne(ctx, bson.M{"email": email}).Decode(&admin)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return utils.DataResponse(c, fiber.StatusOK, map[string]interface{}{
				"isAdmin":      false,
				"isSuperAdmin": false,
			})
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Database error", err)
	}

	return utils.DataResponse(c, fiber.StatusOK, map[string]interface{}{
		"isAdmin":      true,
		"isSuperAdmin": admin.Role == "superadmin",
	})
}

// GetAllAdmins returns all admins (Super Admin only)
func GetAllAdmins(c *fiber.Ctx) error {
	requesterEmail := c.Query("requesterEmail")
	if requesterEmail == "" {
		return utils.ErrorResponse(c, fiber.StatusUnauthorized, "Requester email required", nil)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("admins")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Verify requester is superadmin (Case Insensitive)
	var requester models.Admin
	// Regex for exact match but case insensitive
	filter := bson.M{"email": bson.M{"$regex": "^" + requesterEmail + "$", "$options": "i"}}
	err = collection.FindOne(ctx, filter).Decode(&requester)
	if err != nil || requester.Role != "superadmin" {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "Access Denied. Only super admins can manage other admins.", nil)
	}

	// Fetch all admins
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch admins", err)
	}
	defer cursor.Close(ctx)

	var admins []models.Admin
	if err = cursor.All(ctx, &admins); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to decode admins", err)
	}

	// Filter out passwords and add isSuperAdmin flag for frontend
	// Create a response structure that matches what frontend expects
	type AdminResponse struct {
		ID           string    `json:"_id"`
		Email        string    `json:"email"`
		Name         string    `json:"name"`
		Role         string    `json:"role"`
		Active       bool      `json:"active"`
		IsSuperAdmin bool      `json:"isSuperAdmin"`
		CreatedAt    time.Time `json:"createdAt"`
		CreatedBy    string    `json:"createdBy,omitempty"`
	}

	var adminResponses []AdminResponse
	for _, a := range admins {
		adminResponses = append(adminResponses, AdminResponse{
			ID:           a.ID.Hex(),
			Email:        a.Email,
			Name:         a.Name,
			Role:         a.Role,
			Active:       a.Active,
			IsSuperAdmin: a.Role == "superadmin",
			CreatedAt:    a.CreatedAt,
			CreatedBy:    "system", // Placeholder
		})
	}

	// Returns { success: true, message: "...", data: { admins: [...] } }
	// But frontend expects result.admins directly if using SuccessResponse?
	// specific frontend code: setAdmins(result.admins || [])
	// SuccessResponse returns data in "data" field.
	// So frontend gets response.data which is { success: true, data: { admins: ... } }
	// usage: result.admins
	// Wait, if frontend calls response.data, and response.data is { success: true, data: {admins: ...} }
	// Then result.admins is undefined. result.data.admins would be correct.
	// BUT, if I return a custom map instead of SuccessResponse struct?
	// Frontend: const result = await getAllAdmins... (returns response.data)
	// If I return map[string]interface{}{ "success": true, "admins": [...] }
	// that fits perfectly.

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"admins":  adminResponses,
	})
}

// AddAdmin adds a new admin (Super Admin only)
func AddAdmin(c *fiber.Ctx) error {
	var input struct {
		Email          string `json:"email"`
		RequesterEmail string `json:"requesterEmail"`
	}

	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	if input.Email == "" || input.RequesterEmail == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Email and requester email required", nil)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("admins")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Verify requester is superadmin
	var requester models.Admin
	filter := bson.M{"email": bson.M{"$regex": "^" + input.RequesterEmail + "$", "$options": "i"}}
	err = collection.FindOne(ctx, filter).Decode(&requester)
	if err != nil || requester.Role != "superadmin" {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "Access Denied. Only super admins can manage other admins.", nil)
	}

	// Check if already exists
	count, err := collection.CountDocuments(ctx, bson.M{"email": bson.M{"$regex": "^" + input.Email + "$", "$options": "i"}})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Database error", err)
	}
	if count > 0 {
		return utils.ErrorResponse(c, fiber.StatusConflict, "Email already registered as admin", nil)
	}

	// Create new admin
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	newAdmin := models.Admin{
		Email:     input.Email, // Use provided email casing
		Name:      "New Admin",
		Password:  string(hashedPassword),
		Role:      "admin",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Active:    true,
	}

	_, err = collection.InsertOne(ctx, newAdmin)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create admin", err)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Admin added successfully",
		"admin":   newAdmin,
	})
}

// RemoveAdmin removes an admin (Super Admin only)
func RemoveAdmin(c *fiber.Ctx) error {
	var input struct {
		Email          string `json:"email"`
		RequesterEmail string `json:"requesterEmail"`
	}

	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	// Prevent removing yourself
	if input.Email == input.RequesterEmail {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "You cannot remove yourself", nil)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("admins")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Verify requester is superadmin
	var requester models.Admin
	filter := bson.M{"email": bson.M{"$regex": "^" + input.RequesterEmail + "$", "$options": "i"}}
	err = collection.FindOne(ctx, filter).Decode(&requester)
	if err != nil || requester.Role != "superadmin" {
		return utils.ErrorResponse(c, fiber.StatusForbidden, "Access Denied. Only super admins can manage other admins.", nil)
	}

	// Delete admin
	res, err := collection.DeleteOne(ctx, bson.M{"email": bson.M{"$regex": "^" + input.Email + "$", "$options": "i"}})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to remove admin", err)
	}

	if res.DeletedCount == 0 {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Admin not found", nil)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Admin removed successfully",
	})
}
