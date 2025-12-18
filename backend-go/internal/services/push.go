package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/internal/models"
	"go.mongodb.org/mongo-driver/bson"
)

// SendPushNotification sends a push notification to a subscription
func SendPushNotification(subscription *models.Subscription, message, title string, options map[string]interface{}) error {
	// Skip if VAPID keys are missing
	if config.AppConfig.VAPIDPublicKey == "" || config.AppConfig.VAPIDPrivateKey == "" {
		log.Println("⚠️ VAPID keys missing, skipping push notification")
		return nil
	}

	// Construct payload
	frontendURL := config.AppConfig.FrontendURL
	if frontendURL == "" {
		frontendURL = "https://foodfantasy.vercel.app" // Fallback
	}

	payload := map[string]interface{}{
		"title":   title,
		"body":    message,
		"icon":    frontendURL + "/logo.png",
		"badge":   frontendURL + "/logo.png",
		"data":    options,
		"vibrate": []int{100, 50, 100},
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	// Decode subscription
	s := &webpush.Subscription{
		Endpoint: subscription.Endpoint,
		Keys: webpush.Keys{
			P256dh: subscription.Keys.P256dh,
			Auth:   subscription.Keys.Auth,
		},
	}

	// Send notification
	resp, err := webpush.SendNotification(payloadBytes, s, &webpush.Options{
		Subscriber:      config.AppConfig.VAPIDSubject,
		VAPIDPublicKey:  config.AppConfig.VAPIDPublicKey,
		VAPIDPrivateKey: config.AppConfig.VAPIDPrivateKey,
		TTL:             86400, // 24 hours
	})

	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("push notification failed with status: %d", resp.StatusCode)
	}

	return nil
}

// SendPushToUser sends a notification to a specific user
func SendPushToUser(userEmail, title, message string, data map[string]interface{}) {
	if userEmail == "" {
		return
	}

	db, err := config.GetDatabase()
	if err != nil {
		log.Printf("❌ Database error in SendPushToUser: %v", err)
		return
	}

	collection := db.Collection("subscriptions")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.M{"userEmail": strings.ToLower(userEmail)})
	if err != nil {
		log.Printf("❌ Error finding subscriptions for %s: %v", userEmail, err)
		return
	}
	defer cursor.Close(ctx)

	var subscriptions []models.Subscription
	if err = cursor.All(ctx, &subscriptions); err != nil {
		log.Printf("❌ Error decoding subscriptions: %v", err)
		return
	}

	for _, sub := range subscriptions {
		err := SendPushNotification(&sub, message, title, data)
		if err != nil {
			log.Printf("⚠️ Failed to send push to %s: %v", userEmail, err)
		}
	}
}

// SendPushToAdmins sends a notification to all admins
func SendPushToAdmins(title, message string, data map[string]interface{}) {
	db, err := config.GetDatabase()
	if err != nil {
		log.Printf("❌ Database error in SendPushToAdmins: %v", err)
		return
	}

	// 1. Get all admin emails
	adminCollection := db.Collection("admins")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := adminCollection.Find(ctx, bson.M{"role": bson.M{"$in": []string{"admin", "superadmin"}}})
	if err != nil {
		log.Printf("❌ Error finding admins: %v", err)
		return
	}
	defer cursor.Close(ctx)

	var admins []models.Admin
	if err = cursor.All(ctx, &admins); err != nil {
		log.Printf("❌ Error decoding admins: %v", err)
		return
	}

	var emails []string
	for _, admin := range admins {
		emails = append(emails, strings.ToLower(admin.Email))
	}

	if len(emails) == 0 {
		return
	}

	// 2. Find all subscriptions for these emails
	subCollection := db.Collection("subscriptions")
	subCursor, err := subCollection.Find(ctx, bson.M{"userEmail": bson.M{"$in": emails}})
	if err != nil {
		log.Printf("❌ Error finding admin subscriptions: %v", err)
		return
	}
	defer subCursor.Close(ctx)

	var subscriptions []models.Subscription
	if err = subCursor.All(ctx, &subscriptions); err != nil {
		log.Printf("❌ Error decoding admin subscriptions: %v", err)
		return
	}

	for _, sub := range subscriptions {
		err := SendPushNotification(&sub, message, title, data)
		if err != nil {
			log.Printf("⚠️ Failed to send admin push: %v", err)
		}
	}
}
