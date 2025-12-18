package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Order represents a food order
type Order struct {
	ID             primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	UserID         string             `json:"userId,omitempty" bson:"userId,omitempty"`
	UserEmail      string             `json:"userEmail" bson:"userEmail" validate:"required,email"`
	Username       string             `json:"userName,omitempty" bson:"username,omitempty"`
	FoodName       string             `json:"foodName" bson:"foodName" validate:"required"`
	Quantity       int                `json:"quantity" bson:"quantity" validate:"required,min=1"`
	Price          float64            `json:"price" bson:"price" validate:"required,min=0"`
	TotalPrice     float64            `json:"totalPrice,omitempty" bson:"totalPrice,omitempty"`
	Size           string             `json:"size,omitempty" bson:"size,omitempty"`
	Status         string             `json:"status" bson:"status" validate:"required,oneof=Order Preparing Served Completed"`
	PaymentStatus  string             `json:"paymentStatus" bson:"paymentStatus" validate:"required,oneof=Unpaid Paid"`
	PaymentMethod  string             `json:"paymentMethod,omitempty" bson:"paymentMethod,omitempty" validate:"omitempty,oneof=UPI Cash Other"`
	IsInRestaurant bool               `json:"isInRestaurant" bson:"isInRestaurant"`
	TableNumber    int                `json:"tableNumber" bson:"tableNumber"`
	ChairIndices   []int              `json:"chairIndices,omitempty" bson:"chairIndices,omitempty"`
	Tables         []TableSelection   `json:"tables,omitempty" bson:"tables,omitempty"`
	PhoneNumber    string             `json:"contactNumber,omitempty" bson:"phoneNumber,omitempty"`
	Address        *Address           `json:"address,omitempty" bson:"address,omitempty"`
	CreatedAt      time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt      time.Time          `json:"updatedAt" bson:"updatedAt"`
}

// TableSelection represents a table and chair selection
type TableSelection struct {
	TableNumber  int   `json:"tableNumber" bson:"tableNumber"`
	ChairIndices []int `json:"chairIndices" bson:"chairIndices"`
}

// Address represents delivery address
type Address struct {
	Street  string  `json:"street,omitempty" bson:"street,omitempty"`
	City    string  `json:"city,omitempty" bson:"city,omitempty"`
	State   string  `json:"state,omitempty" bson:"state,omitempty"`
	ZipCode string  `json:"zipCode,omitempty" bson:"zipCode,omitempty"`
	Lat     float64 `json:"lat,omitempty" bson:"lat,omitempty"`
	Lng     float64 `json:"lng,omitempty" bson:"lng,omitempty"`
}

// OrderInput is used for creating orders
type OrderInput struct {
	UserID         string           `json:"userId,omitempty"`
	UserEmail      string           `json:"userEmail" validate:"required,email"`
	Username       string           `json:"userName,omitempty"`
	FoodName       string           `json:"foodName" validate:"required"`
	Quantity       int              `json:"quantity" validate:"required,min=1"`
	Price          float64          `json:"price" validate:"required,min=0"`
	Size           string           `json:"size,omitempty"`
	Status         string           `json:"status,omitempty"`
	PaymentStatus  string           `json:"paymentStatus,omitempty"`
	PaymentMethod  string           `json:"paymentMethod,omitempty"`
	IsInRestaurant bool             `json:"isInRestaurant"`
	TableNumber    int              `json:"tableNumber"`
	ChairIndices   []int            `json:"chairIndices,omitempty"`
	Tables         []TableSelection `json:"tables,omitempty"`
	PhoneNumber    string           `json:"contactNumber,omitempty"`
	Address        *Address         `json:"address,omitempty"`
}

// NewOrder creates a new Order with defaults
func NewOrder(input OrderInput) *Order {
	now := time.Now()

	status := "Order"
	if input.Status != "" {
		status = input.Status
	}

	paymentStatus := "Unpaid"
	if input.PaymentStatus != "" {
		paymentStatus = input.PaymentStatus
	}

	totalPrice := input.Price * float64(input.Quantity)

	return &Order{
		UserID:         input.UserID,
		UserEmail:      input.UserEmail,
		Username:       input.Username,
		FoodName:       input.FoodName,
		Quantity:       input.Quantity,
		Price:          input.Price,
		TotalPrice:     totalPrice,
		Size:           input.Size,
		Status:         status,
		PaymentStatus:  paymentStatus,
		PaymentMethod:  input.PaymentMethod,
		IsInRestaurant: input.IsInRestaurant,
		TableNumber:    input.TableNumber,
		ChairIndices:   input.ChairIndices,
		Tables:         input.Tables,
		PhoneNumber:    input.PhoneNumber,
		Address:        input.Address,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
}

// OrderUpdateInput is used for updating orders
type OrderUpdateInput struct {
	Status        string `json:"status,omitempty" validate:"omitempty,oneof=Order Preparing Served Completed"`
	PaymentStatus string `json:"paymentStatus,omitempty" validate:"omitempty,oneof=Unpaid Paid"`
	PaymentMethod string `json:"paymentMethod,omitempty" validate:"omitempty,oneof=UPI Cash Other"`
}
