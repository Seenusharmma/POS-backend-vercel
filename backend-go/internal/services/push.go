package services

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/internal/models"
)

// SendPushNotification sends a push notification to a subscription
func SendPushNotification(subscription *models.Subscription, message, title string, options map[string]interface{}) error {
	// Skip if VAPID keys are missing
	if config.AppConfig.VAPIDPublicKey == "" || config.AppConfig.VAPIDPrivateKey == "" {
		log.Println("⚠️ VAPID keys missing, skipping push notification")
		return nil
	}

	// Construct payload
	payload := map[string]interface{}{
		"title": title,
		"body":  message,
		"icon":  "/icon-192x192.png", // Default icon
		"badge": "/badge-72x72.png",  // Default badge
		"data":  options,
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
		Subscriber:      "mailto:support@foodfantasy.com", // Should be configured
		VAPIDPublicKey:  config.AppConfig.VAPIDPublicKey,
		VAPIDPrivateKey: config.AppConfig.VAPIDPrivateKey,
		TTL:             60, // Time to live in seconds
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
	// This would require looking up subscriptions by email
	// Implementation depends on how we query subscriptions
	// For now, this is a placeholder
}

// SendPushToAdmins sends a notification to all admins
func SendPushToAdmins(title, message string, data map[string]interface{}) {
	// This would require looking up all admin subscriptions
	// Placeholder
}
