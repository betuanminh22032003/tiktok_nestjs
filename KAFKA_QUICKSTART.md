# 🚀 Quick Start Guide - Kafka Version

## Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- Git

## 1. Clone & Install

```powershell
# Clone repository
git clone <repository-url>
cd tiktok_nestjs

# Install dependencies
npm install
```

## 2. Start Infrastructure

```powershell
# Start PostgreSQL, Redis, Zookeeper, and Kafka
docker-compose up -d postgres redis zookeeper kafka

# Wait ~30 seconds for Kafka to initialize
# Verify services
docker-compose ps
```

## 3. Generate Environment Variables

```powershell
# Auto-generate .env with secure secrets
.\scripts.ps1 ensure-env
```

Or manually create `.env`:
```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=tiktok_clone

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=tiktok-service
KAFKA_GROUP_ID=tiktok-group

# JWT (change in production!)
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# gRPC
GRPC_AUTH_URL=localhost:50051
GRPC_VIDEO_URL=localhost:50052
GRPC_INTERACTION_URL=localhost:50053
GRPC_NOTIFICATION_URL=localhost:50054
```

## 4. Start All Services

### Option A: Docker (Recommended)
```powershell
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### Option B: Local Development
```powershell
# Terminal 1 - API Gateway
npm run start:gateway

# Terminal 2 - Auth Service
npm run start:auth

# Terminal 3 - Video Service
npm run start:video

# Terminal 4 - Interaction Service
npm run start:interaction

# Terminal 5 - Notification Service
npm run start:notification

# Terminal 6 - Frontend
cd tiktok-frontend
npm install
npm run dev
```

## 5. Verify Services

```powershell
# Use built-in verification script
.\verify.ps1

# Or check manually
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Video Service
curl http://localhost:3003/health  # Interaction Service
curl http://localhost:3004/health  # Notification Service
```

## 6. Access Application

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | Next.js App |
| **API Gateway** | http://localhost:4000 | REST API |
| **Swagger Docs** | http://localhost:4000/api/docs | API Documentation |
| **Kafka** | localhost:9092 | Broker |
| **Prometheus** | http://localhost:9090 | Metrics |
| **Grafana** | http://localhost:3005 | Dashboards (admin/admin) |

## 7. Test Kafka Events

```powershell
# Watch video.created events
docker exec -it tiktok_kafka kafka-console-consumer `
  --bootstrap-server localhost:9092 `
  --topic video.created `
  --from-beginning

# Watch video.liked events
docker exec -it tiktok_kafka kafka-console-consumer `
  --bootstrap-server localhost:9092 `
  --topic video.liked `
  --from-beginning
```

## 8. Common Operations

### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f video-service
docker-compose logs -f kafka
```

### Stop Services
```powershell
# Stop all
docker-compose down

# Stop and remove volumes (CAUTION: deletes data)
docker-compose down -v
```

### Rebuild Service
```powershell
# Rebuild specific service
docker-compose up --build video-service

# Rebuild all
docker-compose up --build
```

### Reset Database
```powershell
.\scripts.ps1 reset-db
```

## Troubleshooting

### Kafka Not Starting
```powershell
# Check Zookeeper first
docker logs tiktok_zookeeper

# Check Kafka logs
docker logs tiktok_kafka

# Restart services
docker-compose restart zookeeper kafka
```

### Service Can't Connect to Kafka
```powershell
# Verify Kafka is healthy
docker exec tiktok_kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Check service environment
docker-compose exec video-service env | grep KAFKA
```

### Database Connection Errors
```powershell
# Check PostgreSQL
docker logs tiktok_postgres

# Restart database
docker-compose restart postgres
```

### Port Already in Use
```powershell
# Find process using port
netstat -ano | findstr :9092

# Stop Docker services
docker-compose down
```

## Development Workflow

### 1. Start Infrastructure Only
```powershell
.\scripts.ps1 start-infra
```

### 2. Run Services Locally
```powershell
# In separate terminals
npm run start:gateway
npm run start:auth
npm run start:video
# ... etc
```

### 3. Watch for Changes
```powershell
npm run start:dev  # Watches all services
```

### 4. Run Tests
```powershell
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Useful Commands

```powershell
# Format code
npm run format

# Lint code
npm run lint

# Build project
npm run build

# Check service health
.\scripts.ps1 health

# View all available commands
.\scripts.ps1 help
```

## Next Steps

1. Read [KAFKA_MIGRATION.md](./KAFKA_MIGRATION.md) for architecture details
2. Check [README.md](./README.md) for full documentation
3. Review [API documentation](http://localhost:4000/api/docs) when services are running
4. Explore Kafka topics and message flows

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Ensure ports are available
4. Review environment variables in `.env`

---

Happy coding! 🎉
