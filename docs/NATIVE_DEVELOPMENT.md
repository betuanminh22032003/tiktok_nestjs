# Native Development Scripts

These PowerShell scripts allow you to run the TikTok Clone microservices natively (outside Docker) while keeping infrastructure services (PostgreSQL, Redis, Kafka, etc.) in Docker containers. This setup makes debugging significantly easier.

## 📋 Prerequisites

- **Docker Desktop** - Running and accessible
- **Node.js** - v18 or higher
- **npm** - v9 or higher
- **PowerShell** - v5.1 or higher (Windows PowerShell or PowerShell Core)

## 🚀 Quick Start

### Start Everything
```powershell
.\run-native.ps1
```

This will:
1. Start infrastructure services in Docker (PostgreSQL, Redis, Kafka, Zookeeper, RabbitMQ)
2. Wait for services to be healthy
3. Start all microservices natively in separate PowerShell windows
4. Start the Next.js frontend

### Check Service Status
```powershell
.\status-native.ps1
```

### Stop Everything
```powershell
.\stop-native.ps1
```

## 📝 Script Details

### `run-native.ps1`

Main script to start all services.

**Options:**
- `-SkipInfra` - Skip starting infrastructure (assumes already running)
- `-SkipFrontend` - Don't start the Next.js frontend
- `-StopOnly` - Stop all services and exit

**Examples:**
```powershell
# Start everything
.\run-native.ps1

# Start only microservices (infra already running)
.\run-native.ps1 -SkipInfra

# Start without frontend
.\run-native.ps1 -SkipFrontend

# Stop all services
.\run-native.ps1 -StopOnly
```

### `stop-native.ps1`

Stop all running services.

**Options:**
- `-InfraOnly` - Stop only infrastructure containers
- `-ServicesOnly` - Stop only microservices

**Examples:**
```powershell
# Stop everything
.\stop-native.ps1

# Stop only infrastructure
.\stop-native.ps1 -InfraOnly

# Stop only microservices
.\stop-native.ps1 -ServicesOnly
```

### `status-native.ps1`

Check the status of all services.

```powershell
.\status-native.ps1
```

Shows:
- Infrastructure container status and health
- Microservice port availability
- Node.js process information
- Frontend status

## 🔌 Service Ports

### Infrastructure (Docker)
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Kafka**: `localhost:9092`
- **Zookeeper**: `localhost:2181`
- **RabbitMQ**: `localhost:5672`
  - Management UI: http://localhost:15672 (admin/admin)

### Microservices (Native)
- **API Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3001
  - gRPC: `localhost:50051`
- **Video Service**: http://localhost:3002
  - gRPC: `localhost:50052`
- **Interaction Service**: http://localhost:3003
  - gRPC: `localhost:50053`
- **Notification Service**: http://localhost:3004
  - gRPC: `localhost:50054`

### Frontend
- **Next.js App**: http://localhost:3001

## 🐛 Debugging

### Debugging in VS Code

Each microservice runs in its own PowerShell window, but you can also attach VS Code's debugger:

1. Open the microservice you want to debug in VS Code
2. Set breakpoints in your code
3. Use the "Attach to Process" debugger configuration
4. Select the Node.js process for your service

### Debugging with Chrome DevTools

Each service starts with inspect support. You can:

1. Open Chrome and navigate to `chrome://inspect`
2. Click "Configure" and add `localhost:9229` (or the appropriate debug port)
3. Click "inspect" on your target service

### View Logs

Each microservice runs in a separate PowerShell window, so you can view logs in real-time.

For infrastructure logs:
```powershell
# View all infrastructure logs
docker-compose -f docker-compose.infra.yml logs -f

# View specific service logs
docker-compose -f docker-compose.infra.yml logs -f postgres
docker-compose -f docker-compose.infra.yml logs -f kafka
```

## 🔧 Configuration

### Environment Variables

The script automatically creates a `.env` file if it doesn't exist. You can modify it to change:

- Database credentials
- Redis configuration
- Kafka brokers
- JWT secrets
- Service ports
- gRPC URLs

Example `.env`:
```env
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

# JWT
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key
```

### Custom Infrastructure Configuration

The script generates `docker-compose.infra.yml` automatically. You can modify this file to:
- Change port mappings
- Adjust resource limits
- Add or remove services
- Configure health checks

## 🚨 Troubleshooting

### Issue: "Docker is not running"
**Solution**: Start Docker Desktop and wait for it to fully initialize.

### Issue: "Port already in use"
**Solution**: 
```powershell
# Check what's using the port (e.g., 3000)
netstat -ano | findstr :3000

# Kill the process using the port
Stop-Process -Id <PID> -Force
```

### Issue: Infrastructure services unhealthy
**Solution**:
```powershell
# Check container logs
docker-compose -f docker-compose.infra.yml logs postgres
docker-compose -f docker-compose.infra.yml logs kafka

# Restart containers
docker-compose -f docker-compose.infra.yml restart
```

### Issue: Microservices won't start
**Solution**:
```powershell
# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install

# Check for TypeScript compilation errors
npm run build
```

### Issue: Cannot connect to Kafka
**Solution**: Kafka takes longer to start. Wait 30-60 seconds after infrastructure starts, or check:
```powershell
docker-compose -f docker-compose.infra.yml logs kafka
```

## 🧹 Cleanup

### Remove all data volumes
```powershell
docker-compose -f docker-compose.infra.yml down -v
```

### Full cleanup
```powershell
# Stop all services
.\stop-native.ps1

# Remove Docker volumes
docker-compose -f docker-compose.infra.yml down -v

# Clean node_modules (optional)
Remove-Item -Recurse -Force node_modules
```

## 💡 Tips

1. **Faster Restarts**: Use `-SkipInfra` when restarting microservices
2. **Selective Debugging**: Close windows for services you're not debugging
3. **Database Access**: Use pgAdmin or DBeaver to connect to PostgreSQL
4. **Redis Access**: Use RedisInsight or redis-cli
5. **Kafka Access**: Use Kafka Tool or kafkacat

## 📚 Additional Resources

- [Development Guide](./docs/DEVELOPMENT.md)
- [Architecture Overview](./docs/MONOREPO_ARCHITECTURE.md)
- [API Documentation](http://localhost:3000/api/docs) (when API Gateway is running)

## 🤝 Contributing

If you improve these scripts or find issues, please update the documentation and submit a PR!
