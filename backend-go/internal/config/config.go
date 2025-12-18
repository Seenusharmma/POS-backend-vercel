package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	// Server
	Port        string
	Environment string

	// Database
	MongoURI string
	DBName   string

	// Redis
	RedisURL string

	// Cloudinary
	CloudinaryCloudName string
	CloudinaryAPIKey    string
	CloudinaryAPISecret string

	// CORS
	FrontendURL string

	// JWT
	JWTSecret string

	// Push Notifications
	VAPIDPublicKey  string
	VAPIDPrivateKey string
	VAPIDSubject    string
}

var AppConfig *Config

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	// Load .env file if exists
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ No .env file found, using environment variables")
	}

	config := &Config{
		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("GO_ENV", "development"),

		MongoURI: getEnv("MONGODB_URI", ""),
		DBName:   getEnv("DB_NAME", "foodfantasy"),

		RedisURL: getEnv("REDIS_URL", ""),

		CloudinaryCloudName: getEnv("CLOUDINARY_CLOUD_NAME", ""),
		CloudinaryAPIKey:    getEnv("CLOUDINARY_API_KEY", ""),
		CloudinaryAPISecret: getEnv("CLOUDINARY_API_SECRET", ""),

		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),

		JWTSecret: getEnv("JWT_SECRET", "your-secret-key-change-in-production"),

		VAPIDPublicKey:  getEnv("VAPID_PUBLIC_KEY", ""),
		VAPIDPrivateKey: getEnv("VAPID_PRIVATE_KEY", ""),
		VAPIDSubject:    getEnv("VAPID_SUBJECT", "mailto:roshansharma7250@gmail.com"),
	}

	AppConfig = config
	return config
}

// getEnv gets environment variable with fallback
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// IsDevelopment checks if running in development mode
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// IsProduction checks if running in production mode
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}
