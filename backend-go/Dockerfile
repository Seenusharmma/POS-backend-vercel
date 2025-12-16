# Build Stage
FROM golang:1.24-alpine AS builder

# Install git for fetching dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
# CGO_ENABLED=0 for static binary (alpine compatibility)
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server/main.go

# Production Stage
FROM alpine:latest

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/main .

# Expose port (Render sets PORT env var, but 8080 is our default)
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
