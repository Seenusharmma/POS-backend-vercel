# Go Backend API

High-performance Go backend for FoodFantasy application.

## 🚀 Features

- **Blazing Fast**: Built with Fiber (Express-like, but 10x faster)
- **MongoDB**: Optimized connection pooling
- **Redis**: Caching layer for high traffic
- **WebSocket**: Real-time updates
- **Cloudinary**: Image uploads
- **Clean Architecture**: Modular and maintainable code

## 🛠️ Setup

1. **Install Go** (1.21+)
2. **Clone** the repository
3. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in credentials.

   ```bash
   cp .env.example .env
   ```

4. **Install Dependencies**:
   ```bash
   go mod tidy
   ```

5. **Run Development Server**:
   ```bash
   go run cmd/server/main.go
   ```

## 📦 Build for Production

```bash
go build -o server cmd/server/main.go
./server
```

## 🧪 Testing

```bash
go test ./...
```
