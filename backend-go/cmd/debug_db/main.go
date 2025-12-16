package main

import (
	"context"
	"fmt"
	"log"

	"github.com/foodfantasy/backend-go/internal/config"
	"go.mongodb.org/mongo-driver/bson"
)

func main() {
	fmt.Println("🔍 Debugging MongoDB Connection...")

	// Load config to get URI
	cfg := config.LoadConfig()

	// Force connection
	client, err := config.GetMongoClient()
	if err != nil {
		log.Fatalf("❌ Failed to connect: %v", err)
	}
	defer client.Disconnect(context.Background())

	// List Databases
	dbs, err := client.ListDatabaseNames(context.Background(), bson.M{})
	if err != nil {
		log.Fatalf("❌ Failed to list databases: %v", err)
	}

	fmt.Println("\n📂 Available Databases:")
	for _, db := range dbs {
		fmt.Printf(" - %s\n", db)
	}

	// Inspect Current configured DB
	targetDB := cfg.DBName
	fmt.Printf("\n🧐 Inspecting Configured DB: '%s'\n", targetDB)

	db := client.Database(targetDB)
	collections, err := db.ListCollectionNames(context.Background(), bson.M{})
	if err != nil {
		log.Fatalf("❌ Failed to list collections in %s: %v", targetDB, err)
	}

	if len(collections) == 0 {
		fmt.Printf("⚠️  No collections found in '%s'. Is this the right DB?\n", targetDB)
	} else {
		fmt.Println("   Collections:")
		for _, coll := range collections {
			count, _ := db.Collection(coll).CountDocuments(context.Background(), bson.M{})
			fmt.Printf("   - %s (Count: %d)\n", coll, count)
		}
	}

	// Inspect 'test' DB just in case (common default)
	if contains(dbs, "test") {
		fmt.Printf("\n🧐 Inspecting 'test' DB (common default):\n")
		testDB := client.Database("test")
		testColls, _ := testDB.ListCollectionNames(context.Background(), bson.M{})
		for _, coll := range testColls {
			count, _ := testDB.Collection(coll).CountDocuments(context.Background(), bson.M{})
			fmt.Printf("   - %s (Count: %d)\n", coll, count)
		}
	}
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
