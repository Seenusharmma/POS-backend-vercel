package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Offer represents a promotional offer or discount
type Offer struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Title       string             `bson:"title" json:"title" validate:"required"`
	Description string             `bson:"description" json:"description" validate:"required"`
	Image       string             `bson:"image" json:"image"` // URL to Cloudinary
	ValidFrom   time.Time          `bson:"validFrom,omitempty" json:"validFrom,omitempty"`
	ValidUntil  time.Time          `bson:"validUntil,omitempty" json:"validUntil,omitempty"`
	Active      bool               `bson:"active" json:"active"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}
