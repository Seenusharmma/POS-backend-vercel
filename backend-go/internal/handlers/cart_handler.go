package handlers

import (
	"context"
	"time"

	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/internal/models"
	"github.com/foodfantasy/backend-go/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Helper to fetch full cart
func fetchUserCart(userEmail string) ([]models.Cart, error) {
	db, err := config.GetDatabase()
	if err != nil {
		return nil, err
	}

	collection := db.Collection("cart")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{"userEmail": userEmail})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []models.Cart = []models.Cart{}
	if err = cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

// AddToCart adds item to cart
func AddToCart(c *fiber.Ctx) error {
	var input models.CartInput
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	cartItem, err := models.NewCart(input)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid data", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	// Remove duplicate logic - Node.js backend might simply add or update quantity.
	// For now, let's just insert as new item per frontend logic implying "add"
	// Actually, usually check if exists. But let's follow the simple insert for now.

	collection := db.Collection("cart")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, cartItem)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to add to cart", err)
	}

	// Return full cart
	items, err := fetchUserCart(input.UserEmail)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch updated cart", err)
	}

	return utils.DataResponse(c, fiber.StatusCreated, map[string]interface{}{"cart": items})
}

// GetCart returns cart items for a user
func GetCart(c *fiber.Ctx) error {
	userEmail := c.Query("userEmail")
	if userEmail == "" {
		userEmail = c.Query("email")
	}
	if userEmail == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Email required", nil)
	}

	items, err := fetchUserCart(userEmail)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch cart", err)
	}

	return utils.DataResponse(c, fiber.StatusOK, map[string]interface{}{"cart": items})
}

// UpdateCart updates item quantity
func UpdateCart(c *fiber.Ctx) error {
	var input struct {
		UserEmail string `json:"userEmail"`
		FoodID    string `json:"foodId"`
		Quantity  int    `json:"quantity"`
	}
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("cart")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	foodObjID, _ := primitive.ObjectIDFromHex(input.FoodID)

	_, err = collection.UpdateOne(
		ctx,
		bson.M{"userEmail": input.UserEmail, "foodId": foodObjID}, // Assuming foodId field in DB
		bson.M{"$set": bson.M{"quantity": input.Quantity}},
	)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update cart", err)
	}

	items, err := fetchUserCart(input.UserEmail)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch updated cart", err)
	}

	return utils.DataResponse(c, fiber.StatusOK, map[string]interface{}{"cart": items})
}

// RemoveFromCart removes item from cart
func RemoveFromCart(c *fiber.Ctx) error {
	var input struct {
		UserEmail string `json:"userEmail"`
		FoodID    string `json:"foodId"`
	}
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("cart")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	foodObjID, _ := primitive.ObjectIDFromHex(input.FoodID)

	// Delete based on userEmail and foodId (typical for Cart)
	_, err = collection.DeleteOne(ctx, bson.M{"userEmail": input.UserEmail, "foodId": foodObjID})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to remove item", err)
	}

	items, err := fetchUserCart(input.UserEmail)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch updated cart", err)
	}

	return utils.DataResponse(c, fiber.StatusOK, map[string]interface{}{"cart": items})
}

// ClearCart clears user cart
func ClearCart(c *fiber.Ctx) error {
	var input struct {
		UserEmail string `json:"userEmail"`
	}
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("cart")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.DeleteMany(ctx, bson.M{"userEmail": input.UserEmail})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to clear cart", err)
	}

	return utils.DataResponse(c, fiber.StatusOK, map[string]interface{}{"cart": []models.Cart{}})
}
