package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Food represents a food item
type Food struct {
	ID        primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	Name      string             `json:"name" bson:"name" validate:"required"`
	Category  string             `json:"category" bson:"category" validate:"required"`
	Type      string             `json:"type" bson:"type" validate:"required,oneof=Veg Non-Veg Other"`
	Price     float64            `json:"price" bson:"price" validate:"min=0"`
	Image     string             `json:"image,omitempty" bson:"image,omitempty"`
	Available bool               `json:"available" bson:"available"`
	HasSizes  bool               `json:"hasSizes" bson:"hasSizes"`
	SizeType  string             `json:"sizeType,omitempty" bson:"sizeType,omitempty"`
	Sizes     *Sizes             `json:"sizes,omitempty" bson:"sizes,omitempty"`
	HalfFull  *HalfFull          `json:"halfFull,omitempty" bson:"halfFull,omitempty"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// Sizes represents standard size options
type Sizes struct {
	Small  *float64 `json:"Small,omitempty" bson:"Small,omitempty"`
	Medium *float64 `json:"Medium,omitempty" bson:"Medium,omitempty"`
	Large  *float64 `json:"Large,omitempty" bson:"Large,omitempty"`
}

// HalfFull represents half/full size options
type HalfFull struct {
	Half *float64 `json:"Half,omitempty" bson:"Half,omitempty"`
	Full *float64 `json:"Full,omitempty" bson:"Full,omitempty"`
}

// FoodInput is used for creating/updating foods
type FoodInput struct {
	Name      string    `form:"name" validate:"required"`
	Category  string    `form:"category" validate:"required"`
	Type      string    `form:"type" validate:"required,oneof=Veg Non-Veg Other"`
	Price     float64   `form:"price"`
	Available *bool     `form:"available"`
	HasSizes  *bool     `form:"hasSizes"`
	SizeType  string    `form:"sizeType"`
	Sizes     *Sizes    `form:"sizes"`
	HalfFull  *HalfFull `form:"halfFull"`
}

// NewFood creates a new Food with timestamps
func NewFood(input FoodInput, imageURL string) *Food {
	now := time.Now()
	food := &Food{
		Name:      input.Name,
		Category:  input.Category,
		Type:      input.Type,
		Price:     input.Price,
		Image:     imageURL,
		Available: true,
		HasSizes:  false,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if input.Available != nil {
		food.Available = *input.Available
	}

	if input.HasSizes != nil {
		food.HasSizes = *input.HasSizes
	}

	if food.HasSizes {
		food.SizeType = input.SizeType
		if food.SizeType == "half-full" {
			food.HalfFull = input.HalfFull
			food.Sizes = &Sizes{}
		} else {
			food.Sizes = input.Sizes
			food.HalfFull = &HalfFull{}
		}
	} else {
		food.Sizes = &Sizes{}
		food.HalfFull = &HalfFull{}
	}

	return food
}
