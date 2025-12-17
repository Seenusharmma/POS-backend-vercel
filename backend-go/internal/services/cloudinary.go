package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/foodfantasy/backend-go/internal/config"
)

type CloudinaryService struct {
	client *cloudinary.Cloudinary
}

var Cloudinary *CloudinaryService

// InitCloudinary initializes the Cloudinary service
func InitCloudinary() error {
	if config.AppConfig.CloudinaryCloudName == "" {
		log.Println("⚠️ Cloudinary credentials missing, skipping initialization")
		return nil
	}

	cld, err := cloudinary.NewFromParams(
		config.AppConfig.CloudinaryCloudName,
		config.AppConfig.CloudinaryAPIKey,
		config.AppConfig.CloudinaryAPISecret,
	)
	if err != nil {
		return fmt.Errorf("failed to initialize Cloudinary: %w", err)
	}

	Cloudinary = &CloudinaryService{
		client: cld,
	}
	log.Println("✅ Cloudinary initialized successfully")
	return nil
}

// UploadImage uploads an image to Cloudinary
func (s *CloudinaryService) UploadImage(file interface{}, folder string) (string, error) {
	if s == nil || s.client == nil {
		return "", fmt.Errorf("cloudinary not initialized")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	resp, err := s.client.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder: folder,
	})
	if err != nil {
		return "", err
	}

	return resp.SecureURL, nil
}

// DeleteImage deletes an image from Cloudinary
func (s *CloudinaryService) DeleteImage(publicID string) error {
	if s == nil || s.client == nil {
		return fmt.Errorf("cloudinary not initialized")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := s.client.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})
	return err
}

// ExtractPublicIDFromURL helper to get public ID from URL
func ExtractPublicIDFromURL(url string) string {
	// Implementation depends on URL structure
	// Simplified version:
	// .../folder/image.jpg -> folder/image
	// This might need refinement based on exact Cloudinary URL format
	return "" // Placeholder
}
