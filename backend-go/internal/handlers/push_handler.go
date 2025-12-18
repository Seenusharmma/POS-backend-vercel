package handlers

import (
	"context"
	"strings"
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
	var input struct {
		UserEmail    string `json:"userEmail"`
		Subscription struct {
			Endpoint string                  `json:"endpoint"`
			Keys     models.SubscriptionKeys `json:"keys"`
		} `json:"subscription"`
	}
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	finalEndpoint := input.Subscription.Endpoint
	if finalEndpoint == "" {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Missing subscription endpoint", nil)
	}

	subscription := &models.Subscription{
		UserEmail: strings.ToLower(input.UserEmail),
		Endpoint:  finalEndpoint,
		Keys:      input.Subscription.Keys,
		UpdatedAt: time.Now(),
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("subscriptions")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Update or Insert (Upsert) based on endpoint
	filter := bson.M{"endpoint": finalEndpoint}
	update := bson.M{"$set": subscription, "$setOnInsert": bson.M{"createdAt": time.Now()}}
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
