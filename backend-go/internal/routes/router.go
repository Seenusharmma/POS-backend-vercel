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
			ID:    c.Params("id"), // Need a way to identify, maybe from query param
			Conn:  c,
			Send:  make(chan interface{}),
			Type:  c.Query("type", "user"), // "admin" or "user"
			Hub:   ws.MainHub,
			Rooms: make(map[string]bool),
		}

		// Register
		client.Hub.Register <- client

		// Handle specific rooms
		if client.Type == "admin" {
			client.Hub.JoinRoom(client, "admins")
		}

		// Cleanup on close
		defer func() {
			client.Hub.Unregister <- client
			c.Close()
		}()

		// Read loop
		for {
			_, _, err := c.ReadMessage()
			if err != nil {
				break
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
	offers.Get("/active", handlers.GetActiveOffers) // New route

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
