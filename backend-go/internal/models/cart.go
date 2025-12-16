package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Cart represents a shopping cart item
type Cart struct {
	ID        primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	UserEmail string             `json:"userEmail" bson:"userEmail" validate:"required,email"`
	FoodID    primitive.ObjectID `json:"foodId" bson:"foodId" validate:"required"`
	FoodName  string             `json:"foodName" bson:"foodName" validate:"required"`
	Quantity  int                `json:"quantity" bson:"quantity" validate:"required,min=1"`
	Price     float64            `json:"price" bson:"price" validate:"required,min=0"`
	Size      string             `json:"size,omitempty" bson:"size,omitempty"`
	Image     string             `json:"image,omitempty" bson:"image,omitempty"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// CartInput is used for creating/updating cart items
type CartInput struct {
	UserEmail string  `json:"userEmail" validate:"required,email"`
	FoodID    string  `json:"foodId" validate:"required"`
	FoodName  string  `json:"foodName" validate:"required"`
	Quantity  int     `json:"quantity" validate:"required,min=1"`
	Price     float64 `json:"price" validate:"required,min=0"`
	Size      string  `json:"size,omitempty"`
	Image     string  `json:"image,omitempty"`
}

// NewCart creates a new Cart item
func NewCart(input CartInput) (*Cart, error) {
	now := time.Now()

	foodID, err := primitive.ObjectIDFromHex(input.FoodID)
	if err != nil {
		return nil, err
	}

	return &Cart{
		UserEmail: input.UserEmail,
		FoodID:    foodID,
		FoodName:  input.FoodName,
		Quantity:  input.Quantity,
		Price:     input.Price,
		Size:      input.Size,
		Image:     input.Image,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}
