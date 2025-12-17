package config

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

var (
	mongoClient     *mongo.Client
	mongoDatabase   *mongo.Database
	mongoOnce       sync.Once
	isReconnecting  bool
	reconnectMutex  sync.Mutex
	lastAttemptTime time.Time
)

// GetMongoClient returns the MongoDB client instance (singleton)
func GetMongoClient() (*mongo.Client, error) {
	var err error
	mongoOnce.Do(func() {
		err = connectMongoDB()
	})
	return mongoClient, err
}

// GetDatabase returns the MongoDB database instance
func GetDatabase() (*mongo.Database, error) {
	if mongoDatabase != nil {
		// Check if connection is still alive
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		if err := mongoClient.Ping(ctx, readpref.Primary()); err != nil {
			log.Println("⚠️ MongoDB ping failed, reconnecting...")
			if err := reconnectMongoDB(); err != nil {
				return nil, err
			}
		}
		return mongoDatabase, nil
	}

	client, err := GetMongoClient()
	if err != nil {
		return nil, err
	}

	mongoDatabase = client.Database(AppConfig.DBName)
	return mongoDatabase, nil
}

// connectMongoDB establishes connection to MongoDB
func connectMongoDB() error {
	// Prevent connection spam - wait at least 1 second between attempts
	reconnectMutex.Lock()
	timeSinceLastAttempt := time.Since(lastAttemptTime)
	if timeSinceLastAttempt < time.Second {
		time.Sleep(time.Second - timeSinceLastAttempt)
	}
	lastAttemptTime = time.Now()
	reconnectMutex.Unlock()

	log.Println("🔗 Connecting to MongoDB...")

	// MongoDB connection options - optimized for performance
	// MongoDB connection options - simplified for stability
	clientOptions := options.Client().ApplyURI(AppConfig.MongoURI).
		SetServerSelectionTimeout(10 * time.Second).
		SetConnectTimeout(15 * time.Second).
		SetRetryWrites(true)

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Printf("❌ MongoDB connection error: %v\n", err)
		return fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping to verify connection
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		log.Printf("❌ MongoDB ping failed: %v\n", err)
		return fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	mongoClient = client
	mongoDatabase = client.Database(AppConfig.DBName)

	log.Println("✅ MongoDB connected successfully")

	// Start connection health monitor
	go monitorConnection()

	return nil
}

// reconnectMongoDB attempts to reconnect to MongoDB
func reconnectMongoDB() error {
	reconnectMutex.Lock()
	if isReconnecting {
		reconnectMutex.Unlock()
		return fmt.Errorf("reconnection already in progress")
	}
	isReconnecting = true
	reconnectMutex.Unlock()

	defer func() {
		reconnectMutex.Lock()
		isReconnecting = false
		reconnectMutex.Unlock()
	}()

	log.Println("🔄 Attempting to reconnect to MongoDB...")

	// Disconnect existing client
	if mongoClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = mongoClient.Disconnect(ctx)
	}

	// Reset singleton
	mongoOnce = sync.Once{}
	mongoClient = nil
	mongoDatabase = nil

	// Reconnect
	return connectMongoDB()
}

// monitorConnection monitors MongoDB connection health
func monitorConnection() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if mongoClient == nil {
			continue
		}

		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		err := mongoClient.Ping(ctx, readpref.Primary())
		cancel()

		if err != nil {
			log.Printf("⚠️ MongoDB health check failed: %v\n", err)
			if !isReconnecting {
				go func() {
					if err := reconnectMongoDB(); err != nil {
						log.Printf("❌ MongoDB reconnection failed: %v\n", err)
					} else {
						log.Println("✅ MongoDB reconnected successfully")
					}
				}()
			}
		} else if !AppConfig.IsProduction() {
			log.Println("📊 MongoDB health: connected")
		}
	}
}

// DisconnectMongoDB gracefully disconnects from MongoDB
func DisconnectMongoDB() error {
	if mongoClient == nil {
		return nil
	}

	log.Println("🔌 Closing MongoDB connection...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := mongoClient.Disconnect(ctx); err != nil {
		return fmt.Errorf("failed to disconnect from MongoDB: %w", err)
	}

	log.Println("✅ MongoDB connection closed")
	return nil
}

// IsConnected checks if MongoDB is connected
func IsConnected() bool {
	if mongoClient == nil {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err := mongoClient.Ping(ctx, readpref.Primary())
	return err == nil
}
