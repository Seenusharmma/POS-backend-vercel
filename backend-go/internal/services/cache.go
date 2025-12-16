package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/foodfantasy/backend-go/internal/config"
	"github.com/redis/go-redis/v9"
)

type CacheService struct {
	client *redis.Client
}

var Cache *CacheService

// InitCache initializes the Redis cache service
func InitCache() error {
	if config.AppConfig.RedisURL == "" {
		log.Println("⚠️ Redis URL missing, running without cache")
		return nil
	}

	opt, err := redis.ParseURL(config.AppConfig.RedisURL)
	if err != nil {
		return fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	client := redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️ Redis connection failed: %v", err)
		return nil // Don't crash, just run without cache
	}

	Cache = &CacheService{
		client: client,
	}
	log.Println("✅ Redis connected successfully")
	return nil
}

// Get retrieves a value from cache
func (s *CacheService) Get(key string, dest interface{}) error {
	if s == nil || s.client == nil {
		return fmt.Errorf("cache not available")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	val, err := s.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil // Key does not exist
	} else if err != nil {
		return err
	}

	return json.Unmarshal([]byte(val), dest)
}

// Set sets a value in cache
func (s *CacheService) Set(key string, value interface{}, expiration time.Duration) error {
	if s == nil || s.client == nil {
		return nil // Fail silently
	}

	bytes, err := json.Marshal(value)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	return s.client.Set(ctx, key, bytes, expiration).Err()
}

// Delete removes a key from cache
func (s *CacheService) Delete(key string) error {
	if s == nil || s.client == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	return s.client.Del(ctx, key).Err()
}

// InvalidatePattern deletes keys matching a pattern
func (s *CacheService) InvalidatePattern(pattern string) error {
	if s == nil || s.client == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	iter := s.client.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		s.client.Del(ctx, iter.Val())
	}

	return iter.Err()
}
