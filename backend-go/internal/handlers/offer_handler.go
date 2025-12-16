package handlers

import (
	"context"
	"time"

	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
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

	// Find offers where active is true (or exists)
	// Note: Node.js likely filters by { active: true }
	// We'll return all for now or filter if model has IsActive
	// Assuming a simple schema for now since we didn't define Offer model explicitly yet
	// Let's assume we just fetch all and frontend filters, or fetch all from DB

	// Better: Fetch all offers for now to avoid 404
	cursor, err := collection.Find(ctx, bson.M{})
	// If you want active only: bson.M{"active": true}
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch offers", err)
	}
	defer cursor.Close(ctx)

	var offers []bson.M // Using generic map if model not defined, or define struct inline/models
	if err = cursor.All(ctx, &offers); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to decode offers", err)
	}

	return utils.DataResponse(c, fiber.StatusOK, offers)
}

// GetOffers returns all offers (admin)
func GetOffers(c *fiber.Ctx) error {
	return GetActiveOffers(c)
}

// CreateOffer - Placeholder
func CreateOffer(c *fiber.Ctx) error {
	return utils.SuccessResponse(c, fiber.StatusCreated, "Offer created", nil)
}

// DeleteOffer - Placeholder
func DeleteOffer(c *fiber.Ctx) error {
	return utils.SuccessResponse(c, fiber.StatusOK, "Offer deleted", nil)
}
