package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/internal/models"
	"github.com/foodfantasy/backend-go/internal/services"
	"github.com/foodfantasy/backend-go/internal/websocket"
	"github.com/foodfantasy/backend-go/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetOrders returns all orders
func GetOrders(c *fiber.Ctx) error {
	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("orders")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Sort by createdAt desc
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to fetch orders", err)
	}
	defer cursor.Close(ctx)

	var orders []models.Order
	if err = cursor.All(ctx, &orders); err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to decode orders", err)
	}

	return utils.DataResponse(c, fiber.StatusOK, orders)
}

// CreateOrder creates a new order
func CreateOrder(c *fiber.Ctx) error {
	var input models.OrderInput
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	order := models.NewOrder(input)

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("orders")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := collection.InsertOne(ctx, order)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create order", err)
	}

	order.ID = result.InsertedID.(primitive.ObjectID)

	// Broadcast to admins and user
	if websocket.MainHub != nil {
		websocket.MainHub.EmitToAdmins("newOrderPlaced", order)
		if order.UserID != "" {
			websocket.MainHub.EmitToUser(order.UserID, "newOrderPlaced", order)
		}
	}

	// Send Push Notification to admins
	services.SendPushToAdmins(
		"🆕 New Order Placed!",
		fmt.Sprintf("%s ordered %d x %s ($%.2f)", order.Username, order.Quantity, order.FoodName, order.TotalPrice),
		map[string]interface{}{"orderId": order.ID.Hex(), "type": "new_order"},
	)

	return utils.SuccessResponse(c, fiber.StatusCreated, "Order placed successfully", order)
}

// CreateMultipleOrders creates multiple orders at once
func CreateMultipleOrders(c *fiber.Ctx) error {
	var inputs []models.OrderInput
	if err := c.BodyParser(&inputs); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	if len(inputs) == 0 {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "No orders provided", nil)
	}

	var orders []interface{}
	var createdOrders []*models.Order

	for _, input := range inputs {
		order := models.NewOrder(input)
		orders = append(orders, order)
		createdOrders = append(createdOrders, order)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("orders")
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	result, err := collection.InsertMany(ctx, orders)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to create orders", err)
	}

	// Assign IDs back to structs
	for i, id := range result.InsertedIDs {
		createdOrders[i].ID = id.(primitive.ObjectID)
		// Broadcast individually
		if websocket.MainHub != nil {
			websocket.MainHub.EmitToAdmins("newOrderPlaced", createdOrders[i])
			if createdOrders[i].UserID != "" {
				websocket.MainHub.EmitToUser(createdOrders[i].UserID, "newOrderPlaced", createdOrders[i])
			}
		}

		// Send Push to admins for each order in multiple
		services.SendPushToAdmins(
			"🆕 New Multi-Order!",
			fmt.Sprintf("%s ordered %d x %s ($%.2f)", createdOrders[i].Username, createdOrders[i].Quantity, createdOrders[i].FoodName, createdOrders[i].TotalPrice),
			map[string]interface{}{"orderId": createdOrders[i].ID.Hex(), "type": "new_order"},
		)
	}

	return utils.SuccessResponse(c, fiber.StatusCreated, "Multiple orders created successfully", createdOrders)
}

// UpdateOrderStatus updates order status
func UpdateOrderStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID format", err)
	}

	var input models.OrderUpdateInput
	if err := c.BodyParser(&input); err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid input", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("orders")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	if input.Status != "" {
		update["$set"].(bson.M)["status"] = input.Status
	}
	if input.PaymentStatus != "" {
		update["$set"].(bson.M)["paymentStatus"] = input.PaymentStatus
	}
	if input.PaymentMethod != "" {
		update["$set"].(bson.M)["paymentMethod"] = input.PaymentMethod
	}

	var updatedOrder models.Order
	err = collection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objID},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updatedOrder)

	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusNotFound, "Order not found", err)
	}

	// Broadcast update
	if websocket.MainHub != nil {
		websocket.MainHub.EmitToAdmins("orderStatusChanged", updatedOrder)
		if updatedOrder.UserID != "" {
			websocket.MainHub.EmitToUser(updatedOrder.UserID, "orderStatusChanged", updatedOrder)
		}

		// Send payment success event if applicable
		if input.PaymentStatus == "Paid" {
			websocket.MainHub.EmitToAdmins("paymentSuccess", updatedOrder)
			if updatedOrder.UserID != "" {
				websocket.MainHub.EmitToUser(updatedOrder.UserID, "paymentSuccess", updatedOrder)
			}
		}
	}

	// Send Push Notification to User about status update
	if input.Status != "" {
		statusMsg := map[string]string{
			"Order Placed": "Your order has been placed successfully!",
			"Preparing":    "Chef is preparing your delicious meal 👨‍🍳",
			"Ready":        "Your food is ready for pickup/serving! 🍽️",
			"Served":       "Enjoy your meal! It has been served.",
			"Completed":    "Thank you for dining with us! ❤️",
		}
		msg := statusMsg[input.Status]
		if msg == "" {
			msg = fmt.Sprintf("Your order status is now: %s", input.Status)
		}

		services.SendPushToUser(
			updatedOrder.UserEmail,
			"Order Update 👨‍🍳",
			fmt.Sprintf("%s: %s", msg, updatedOrder.FoodName),
			map[string]interface{}{"orderId": updatedOrder.ID.Hex(), "status": input.Status},
		)
	}

	// Send Push for Payment
	if input.PaymentStatus == "Paid" {
		services.SendPushToUser(
			updatedOrder.UserEmail,
			"💰 Payment Received!",
			fmt.Sprintf("Payment for %s ($%.2f) was successful.", updatedOrder.FoodName, updatedOrder.TotalPrice),
			map[string]interface{}{"orderId": updatedOrder.ID.Hex(), "type": "payment_success"},
		)
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Order updated successfully", updatedOrder)
}

// DeleteOrder removes an order
func DeleteOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid ID format", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusServiceUnavailable, "Database connection failed", err)
	}

	collection := db.Collection("orders")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = collection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Failed to delete order", err)
	}

	if websocket.MainHub != nil {
		websocket.MainHub.EmitToAdmins("orderDeleted", id)
	}

	return utils.SuccessResponse(c, fiber.StatusOK, "Order deleted successfully", nil)
}

// GetOccupiedTables returns tables that are currently occupied
func GetOccupiedTables(c *fiber.Ctx) error {
	// Returns mock for now
	return utils.DataResponse(c, fiber.StatusOK, map[string]interface{}{})
}
