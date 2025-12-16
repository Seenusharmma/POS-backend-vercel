package handlers

import (
	"context"
	"time"

	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/internal/models"
	"github.com/foodfantasy/backend-go/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// SubscribePush handles push subscription
func SubscribePush(c *fiber.Ctx) error {
	var input models.SubscriptionInput
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	subscription := models.NewSubscription(input)

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("subscriptions")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Update or Insert (Upsert) based on endpoint or userEmail
	filter := bson.M{"endpoint": input.Endpoint}
	update := bson.M{"$set": subscription}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to save subscription", err)
	}

	return utils.SuccessResponse(c, fiber.StatusCreated, "Subscribed successfully", nil)
}

// GetVAPIDKey returns the VAPID public key
func GetVAPIDKey(c *fiber.Ctx) error {
	return utils.DataResponse(c, fiber.StatusOK, map[string]string{
		"publicKey": config.AppConfig.VAPIDPublicKey,
	})
}
