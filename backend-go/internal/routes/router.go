package routes

import (
	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/internal/handlers"
	ws "github.com/foodfantasy/backend-go/internal/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

// SetupRoutes configures all application routes
func SetupRoutes(app *fiber.App) {
	// API Group
	api := app.Group("/api")

	// --- WebSocket ---
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		// Create client
		client := &ws.Client{
			ID:    c.Params("id"),
			Conn:  c,
			Send:  make(chan interface{}, 256),
			Type:  c.Query("type", "user"),
			Hub:   ws.MainHub,
			Rooms: make(map[string]bool),
		}

		// Register
		client.Hub.Register <- client

		// Cleanup on close
		defer func() {
			client.Hub.Unregister <- client
			c.Close()
		}()

		// Handle specific rooms from query params initially
		if client.Type == "admin" {
			client.Hub.JoinRoom(client, "admins")
		}

		// Write loop
		go func() {
			for {
				msg, ok := <-client.Send
				if !ok {
					return
				}
				if err := c.WriteJSON(msg); err != nil {
					return
				}
			}
		}()

		// Read loop
		for {
			var msg struct {
				Event string                 `json:"event"`
				Data  map[string]interface{} `json:"data"`
			}
			if err := c.ReadJSON(&msg); err != nil {
				break
			}

			// Handle "identify" event
			if msg.Event == "identify" {
				uType, _ := msg.Data["type"].(string)
				uID, _ := msg.Data["userId"].(string)

				if uType != "" {
					client.Type = uType
				}
				if uID != "" {
					client.UserID = uID
					client.Hub.JoinRoom(client, "user:"+uID)
				}
				if uType == "admin" {
					client.Hub.JoinRoom(client, "admins")
				}

				// Send identified acknowledgment
				client.Send <- map[string]interface{}{
					"event": "identified",
					"data": map[string]interface{}{
						"status": "success",
					},
				}
			}
		}
	}))

	// --- Foods ---
	foods := api.Group("/foods")
	foods.Get("/", handlers.GetFoods)
	foods.Get("/:id", handlers.GetFood)
	foods.Post("/add", handlers.AddFood)      // Protected?
	foods.Put("/:id", handlers.UpdateFood)    // Protected?
	foods.Delete("/:id", handlers.DeleteFood) // Protected?

	// --- Orders ---
	orders := api.Group("/orders")
	orders.Get("/", handlers.GetOrders)
	orders.Post("/", handlers.CreateOrder)
	orders.Post("/create-multiple", handlers.CreateMultipleOrders)
	orders.Put("/:id", handlers.UpdateOrderStatus)
	orders.Delete("/:id", handlers.DeleteOrder)
	orders.Get("/occupied-tables", handlers.GetOccupiedTables)

	// --- Admin ---
	admin := api.Group("/admin")
	admin.Post("/login", handlers.AdminLogin)
	admin.Post("/register", handlers.AdminRegister)
	admin.Get("/check", handlers.CheckAdminStatus)
	admin.Get("/all", handlers.GetAllAdmins)      // Super Admin only
	admin.Post("/add", handlers.AddAdmin)         // Super Admin only
	admin.Delete("/remove", handlers.RemoveAdmin) // Super Admin only

	// --- Cart ---
	cart := api.Group("/cart")
	cart.Get("/", handlers.GetCart)                 // GET /api/cart
	cart.Post("/add", handlers.AddToCart)           // POST /api/cart/add
	cart.Put("/update", handlers.UpdateCart)        // PUT /api/cart/update
	cart.Delete("/remove", handlers.RemoveFromCart) // DELETE /api/cart/remove (with body)
	cart.Delete("/clear", handlers.ClearCart)       // DELETE /api/cart/clear

	// --- Push ---
	push := api.Group("/push")
	push.Post("/subscribe", handlers.SubscribePush)
	push.Get("/vapid-key", handlers.GetVAPIDKey) // New route

	// --- Offers ---
	offers := api.Group("/offers")
	offers.Get("/", handlers.GetOffers)             // Admin view
	offers.Get("/active", handlers.GetActiveOffers) // User view (active only)
	offers.Post("/", handlers.CreateOffer)          // Admin create
	offers.Put("/:id", handlers.UpdateOffer)        // Admin update
	offers.Delete("/:id", handlers.DeleteOffer)     // Admin delete

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		status := "ok"
		if !config.IsConnected() {
			status = "db_disconnected"
		}
		return c.JSON(fiber.Map{
			"status": status,
			"uptime": "TODO",
		})
	})
}
