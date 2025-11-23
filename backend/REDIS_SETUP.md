# Redis Caching Setup Guide

This application uses Redis for fast API response caching to improve performance.

## Prerequisites

- Redis server installed and running
- Node.js backend with `ioredis` package (already included)

## Installation

### Local Development

1. **Install Redis** (if not already installed):
   - **Windows**: Download from [Redis for Windows](https://github.com/microsoftarchive/redis/releases) or use WSL
   - **macOS**: `brew install redis`
   - **Linux**: `sudo apt-get install redis-server` (Ubuntu/Debian)

2. **Start Redis Server**:
   ```bash
   # Windows (if installed)
   redis-server

   # macOS/Linux
   redis-server
   ```

3. **Configure Environment Variables**:
   Create or update your `.env` file in the `backend` directory:
   ```env
   # Redis Configuration (Optional - app works without Redis)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```

### Production (Cloud Redis)

For production, use a managed Redis service:

1. **Redis Cloud** (Free tier available): https://redis.com/try-free/
2. **AWS ElastiCache**: https://aws.amazon.com/elasticache/
3. **Azure Cache for Redis**: https://azure.microsoft.com/en-us/services/cache/

Update your `.env` with production Redis credentials:
```env
REDIS_HOST=your-redis-host.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your-redis-password
```

## How It Works

### Cached Endpoints

The following endpoints are cached for faster response times:

1. **GET /api/foods** - Cached for 5 minutes (300 seconds)
2. **GET /api/orders** - Cached for 1 minute (60 seconds)
3. **GET /api/cart** - Cached for 5 minutes (300 seconds)

### Cache Invalidation

Cache is automatically invalidated when data is modified:

- **Foods**: Cache cleared when food is added, updated, or deleted
- **Orders**: Cache cleared when order is created, updated, or deleted
- **Cart**: Cache cleared when cart items are added, updated, or removed

### Cache Behavior

- **Cache Hit**: Data is served from Redis (very fast, < 1ms)
- **Cache Miss**: Data is fetched from MongoDB and cached for future requests
- **Graceful Degradation**: If Redis is unavailable, the app continues to work normally without caching

## Testing Redis Connection

The application will automatically:
- Connect to Redis on startup
- Log connection status in console
- Continue working even if Redis is unavailable

Check console logs for:
- `✅ Redis Connected Successfully` - Redis is working
- `⚠️ Redis connection unavailable` - Redis is not available (app still works)

## Performance Benefits

With Redis caching enabled:
- **API Response Time**: Reduced from ~100-500ms to < 10ms for cached data
- **Database Load**: Significantly reduced (fewer MongoDB queries)
- **User Experience**: Faster page loads and smoother interactions

## Troubleshooting

### Redis Not Connecting

1. **Check if Redis is running**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check Redis port** (default: 6379):
   ```bash
   redis-cli -p 6379 ping
   ```

3. **Check firewall settings** (for remote Redis)

4. **Verify environment variables** in `.env` file

### App Works Without Redis

The application is designed to work without Redis. If Redis is unavailable:
- All requests will go directly to MongoDB
- No caching will occur
- Performance will be slower but functionality remains intact

## Cache Configuration

Cache TTL (Time To Live) can be adjusted in `backend/utils/cache.js`:

```javascript
const CACHE_TTL = {
  FOODS: 300,    // 5 minutes
  ORDERS: 60,    // 1 minute
  CART: 300,     // 5 minutes
  ADMIN: 300,    // 5 minutes
};
```

## Monitoring

Monitor Redis performance:
```bash
# Check Redis info
redis-cli info

# Monitor Redis commands in real-time
redis-cli monitor

# Check memory usage
redis-cli info memory
```

