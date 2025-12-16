package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/foodfantasy/backend-go/internal/middleware"
	"github.com/foodfantasy/backend-go/internal/routes"
	"github.com/foodfantasy/backend-go/internal/services"
	"github.com/foodfantasy/backend-go/internal/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// 1. Load Configuration
	cfg := config.LoadConfig()

	// 2. Initialize Services
	if err := services.InitCloudinary(); err != nil {
		log.Printf("⚠️ Cloudinary not initialized: %v", err)
	}
	if err := services.InitCache(); err != nil {
		log.Printf("⚠️ Redis cache not initialized: %v", err)
	}

	// 3. Initialize Database
	// Connection is lazy loaded in config/database.go, but we can force it here
	if _, err := config.GetMongoClient(); err != nil {
		log.Fatalf("❌ Failed to connect to MongoDB: %v", err)
	}

	// 4. Initialize WebSocket Hub
	websocket.InitHub()

	// 5. Setup Fiber
	app := fiber.New(fiber.Config{
		AppName: "FoodFantasy Go Backend",
		// Increased body limit to 50MB to match Node.js (for image uploads)
		BodyLimit:    50 * 1024 * 1024,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 60 * time.Second,
		// JSONEncoder:  json.Marshal, // Optional: Use custom encoder if needed
		// JSONDecoder:  json.Unmarshal,
	})

	// 6. Global Middleware
	app.Use(recover.New()) // Panic Recovery
	app.Use(helmet.New())  // Security Headers
	app.Use(middleware.LoggerMiddleware())
	app.Use(middleware.CorsMiddleware())

	// 7. Routes
	routes.SetupRoutes(app)

	// 8. Graceful Shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("🛑 Shutting down server...")
		if err := config.DisconnectMongoDB(); err != nil {
			log.Printf("❌ Error closing MongoDB connection: %v", err)
		}
		_ = app.Shutdown()
	}()

	// 9. Start Server
	log.Printf("🚀 Server running on port %s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("❌ Server failed to start: %v", err)
	}
}
