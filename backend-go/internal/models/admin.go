package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Admin represents an admin user
type Admin struct {
	ID        primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	Email     string             `json:"email" bson:"email" validate:"required,email"`
	Password  string             `json:"-" bson:"password" validate:"required,min=6"`
	Name      string             `json:"name" bson:"name" validate:"required"`
	Role      string             `json:"role" bson:"role" validate:"required,oneof=admin superadmin"`
	Active    bool               `json:"active" bson:"active"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// AdminInput is used for admin registration
type AdminInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Name     string `json:"name" validate:"required"`
	Role     string `json:"role,omitempty"`
}

// AdminLoginInput is used for admin login
type AdminLoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// NewAdmin creates a new Admin with defaults
func NewAdmin(input AdminInput, hashedPassword string) *Admin {
	now := time.Now()

	role := "admin"
	if input.Role != "" {
		role = input.Role
	}

	return &Admin{
		Email:     input.Email,
		Password:  hashedPassword,
		Name:      input.Name,
		Role:      role,
		Active:    true,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// Subscription represents a push notification subscription
type Subscription struct {
	ID        primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	UserEmail string             `json:"userEmail" bson:"userEmail" validate:"required,email"`
	Endpoint  string             `json:"endpoint" bson:"endpoint" validate:"required"`
	Keys      SubscriptionKeys   `json:"keys" bson:"keys" validate:"required"`
	UserAgent string             `json:"userAgent,omitempty" bson:"userAgent,omitempty"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// SubscriptionKeys represents subscription keys
type SubscriptionKeys struct {
	P256dh string `json:"p256dh" bson:"p256dh" validate:"required"`
	Auth   string `json:"auth" bson:"auth" validate:"required"`
}

// SubscriptionInput is used for creating subscriptions
type SubscriptionInput struct {
	UserEmail string           `json:"userEmail" validate:"required,email"`
	Endpoint  string           `json:"endpoint" validate:"required"`
	Keys      SubscriptionKeys `json:"keys" validate:"required"`
	UserAgent string           `json:"userAgent,omitempty"`
}

// NewSubscription creates a new Subscription
func NewSubscription(input SubscriptionInput) *Subscription {
	now := time.Now()
	return &Subscription{
		UserEmail: input.UserEmail,
		Endpoint:  input.Endpoint,
		Keys:      input.Keys,
		UserAgent: input.UserAgent,
		CreatedAt: now,
		UpdatedAt: now,
	}
}
