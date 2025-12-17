package handlers

import (
	"context"
	"time"

	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/internal/models"
	"github.com/foodfantasy/backend-go/internal/services"
	"github.com/foodfantasy/backend-go/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GetActiveOffers returns active offers
func GetActiveOffers(c *fiber.Ctx) error {
	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Find active offers
	cursor, err := collection.Find(ctx, bson.M{"active": true})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch offers", err)
	}
	defer cursor.Close(ctx)

	offers := make([]models.Offer, 0)
	if err = cursor.All(ctx, &offers); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to decode offers", err)
	}

	return utils.DataResponse(c, fiber.StatusOK, offers)
}

// GetOffers returns all offers (admin)
func GetOffers(c *fiber.Ctx) error {
	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Find all offers
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch offers", err)
	}
	defer cursor.Close(ctx)

	offers := make([]models.Offer, 0) // Initialize as empty slice to avoid null response
	if err = cursor.All(ctx, &offers); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to decode offers", err)
	}

	return utils.DataResponse(c, fiber.StatusOK, offers)
}

// CreateOffer creates a new offer
func CreateOffer(c *fiber.Ctx) error {
	// Parse form values
	title := c.FormValue("title")
	description := c.FormValue("description")
	activeStr := c.FormValue("active")
	validFromStr := c.FormValue("validFrom")
	validUntilStr := c.FormValue("validUntil")

	if title == "" || description == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Title and description are required", nil)
	}

	// Handle Image Upload
	imageUrl := ""
	file, err := c.FormFile("image")
	if err == nil {
		// Open file
		f, err := file.Open()
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to process image", err)
		}
		defer f.Close()

		// Upload to Cloudinary
		url, err := services.Cloudinary.UploadImage(f, "offers")
		if err != nil {
			return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to upload image", err)
		}
		imageUrl = url
	}

	// Parse Dates
	var validFrom, validUntil time.Time
	if validFromStr != "" {
		validFrom, _ = time.Parse("2006-01-02", validFromStr)
	}
	if validUntilStr != "" {
		validUntil, _ = time.Parse("2006-01-02", validUntilStr)
	}

	// Create Offer
	offer := models.Offer{
		ID:          primitive.NewObjectID(),
		Title:       title,
		Description: description,
		Image:       imageUrl,
		Active:      activeStr == "true",
		ValidFrom:   validFrom,
		ValidUntil:  validUntil,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Save to DB
	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, offer)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create offer", err)
	}

	return utils.DataResponse(c, fiber.StatusCreated, offer)
}

// UpdateOffer updates an existing offer
func UpdateOffer(c *fiber.Ctx) error {
	idStr := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID format", nil)
	}

	// Parse form values - only update provided fields
	// Since we're using FormValues, we need to check what's provided or assume full update
	// Usually PUT is full update, ensure logic matches frontend expectations

	// Create update document
	update := bson.M{
		"updatedAt": time.Now(),
	}

	title := c.FormValue("title")
	if title != "" {
		update["title"] = title
	}

	description := c.FormValue("description")
	if description != "" {
		update["description"] = description
	}

	// Checkboxes/booleans can be tricky if not sent when false
	// Frontend sends "true" or "false" string, or just checkbox value
	activeStr := c.FormValue("active")
	if activeStr != "" {
		update["active"] = activeStr == "true"
	}

	validFromStr := c.FormValue("validFrom")
	if validFromStr != "" {
		validFrom, _ := time.Parse("2006-01-02", validFromStr)
		update["validFrom"] = validFrom
	}

	validUntilStr := c.FormValue("validUntil")
	if validUntilStr != "" {
		validUntil, _ := time.Parse("2006-01-02", validUntilStr)
		update["validUntil"] = validUntil
	}

	// Handle Image Upload
	file, err := c.FormFile("image")
	if err == nil {
		f, err := file.Open()
		if err == nil {
			defer f.Close()
			url, err := services.Cloudinary.UploadImage(f, "offers")
			if err == nil {
				update["image"] = url
			}
		}
	}

	// Update in DB
	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": update})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to update offer", err)
	}

	if result.MatchedCount == 0 {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Offer not found", nil)
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Offer updated successfully", nil)
}

// DeleteOffer deletes an offer
func DeleteOffer(c *fiber.Ctx) error {
	idStr := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID format", nil)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("offers")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete offer", err)
	}

	if result.DeletedCount == 0 {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Offer not found", nil)
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Offer deleted successfully", nil)
}
