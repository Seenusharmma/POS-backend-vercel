package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/internal/models"
	"github.com/foodfantasy/backend-go/internal/services"
	"github.com/foodfantasy/backend-go/internal/websocket"
	"github.com/foodfantasy/backend-go/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetFoods returns all food items
func GetFoods(c *fiber.Ctx) error {
	// Try cache first
	if services.Cache != nil {
		var cachedFoods []models.Food
		if err := services.Cache.Get("foods", &cachedFoods); err == nil {
			return utils.SuccessResponse(c, fiber.StatusOK, "Foods fetched from cache", cachedFoods)
		}
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("foods")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Sort by createdAt desc
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch foods", err)
	}
	defer cursor.Close(ctx)

	// Initialize as empty slice so it marshals to [] instead of null if empty
	var foods []models.Food = []models.Food{}
	if err = cursor.All(ctx, &foods); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to decode foods", err)
	}

	// DEBUG: Print what we found
	fmt.Printf("🔍 GetFoods: Found %d items in DB '%s'\n", len(foods), config.AppConfig.DBName)
	if len(foods) > 0 {
		fmt.Printf("🔍 First item: %+v\n", foods[0])
	} else {
		fmt.Printf("⚠️ No items found! Check if 'foods' collection exists in '%s' database.\n", config.AppConfig.DBName)
	}

	// Cache results
	if services.Cache != nil {
		_ = services.Cache.Set("foods", foods, 1*time.Hour)
	}

	// Use DataResponse to return direct array [ ... ]
	return utils.DataResponse(c, fiber.StatusOK, foods)
}

// GetFood returns a single food item
func GetFood(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID format", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("foods")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var food models.Food
	err = collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&food)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Food not found", err)
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Food fetched successfully", food)
}

// AddFood creates a new food item
func AddFood(c *fiber.Ctx) error {
	var input models.FoodInput
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	// Handle image upload
	file, err := c.FormFile("image")
	imageURL := ""
	if err == nil {
		// Open file
		f, err := file.Open()
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to open image", err)
		}
		defer f.Close()

		// Upload to Cloudinary
		if services.Cloudinary != nil {
			imageURL, err = services.Cloudinary.UploadImage(f, "tastebite_foods")
			if err != nil {
				return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to upload image", err)
			}
		}
	}

	food := models.NewFood(input, imageURL)

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("foods")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := collection.InsertOne(ctx, food)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create food", err)
	}

	food.ID = result.InsertedID.(primitive.ObjectID)

	// Invalidate cache
	if services.Cache != nil {
		_ = services.Cache.Delete("foods")
	}

	// Broadcast update
	if websocket.MainHub != nil {
		websocket.MainHub.BroadcastToAll("newFoodAdded", food)
	}

	return utils.SuccessResponse(c, fiber.StatusCreated, "Food added successfully", food)
}

// UpdateFood updates an existing food item
func UpdateFood(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID format", err)
	}

	var input models.FoodInput
	// We use BodyParser but note that multipart form data binding in Fiber works for these struct fields
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("foods")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Prepare update
	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	// Conditionally update fields
	if input.Name != "" {
		update["$set"].(bson.M)["name"] = input.Name
	}
	if input.Category != "" {
		update["$set"].(bson.M)["category"] = input.Category
	}
	if input.Type != "" {
		update["$set"].(bson.M)["type"] = input.Type
	}
	if input.Price != 0 {
		update["$set"].(bson.M)["price"] = input.Price
	}
	if input.Available != nil {
		update["$set"].(bson.M)["available"] = *input.Available
	}

	// Handle complex fields (sizes, halfFull) logic similar to Node.js...
	// Simplified here for brevity

	// Handle image upload if present
	file, err := c.FormFile("image")
	if err == nil {
		f, err := file.Open()
		if err == nil {
			defer f.Close()
			if services.Cloudinary != nil {
				imageURL, err := services.Cloudinary.UploadImage(f, "tastebite_foods")
				if err == nil {
					update["$set"].(bson.M)["image"] = imageURL
				}
			}
		}
	}

	var updatedFood models.Food
	err = collection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objID},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedFood)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return utils.ErrorResponse(c, fiber.StatusNotFound, "Food not found", nil)
		}
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update food", err)
	}

	// Invalidate cache
	if services.Cache != nil {
		_ = services.Cache.Delete("foods")
	}

	// Broadcast update
	if websocket.MainHub != nil {
		websocket.MainHub.BroadcastToAll("foodUpdated", updatedFood)
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Food updated successfully", updatedFood)
}

// DeleteFood removes a food item
func DeleteFood(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID format", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("foods")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find first to get image URL for deletion
	var food models.Food
	err = collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&food)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Food not found", err)
	}

	// Delete from DB
	_, err = collection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete food", err)
	}

	// Invalidate cache
	if services.Cache != nil {
		_ = services.Cache.Delete("foods")
	}

	// Broadcast update
	if websocket.MainHub != nil {
		websocket.MainHub.BroadcastToAll("foodDeleted", id)
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Food deleted successfully", nil)
}
