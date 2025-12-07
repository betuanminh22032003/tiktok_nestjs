#!/bin/bash
# Monitoring & Logging Setup Script

set -e

echo "🚀 Setting up TikTok Clone Monitoring & Logging Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

echo "✅ Docker is running"

# Create necessary directories
mkdir -p logs
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/dashboards

echo "📁 Created required directories"

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

echo "✅ Dependencies installed"

# Build the project
echo "🔨 Building the project..."
npm run build

echo "✅ Build completed"

# Start infrastructure
echo "🐳 Starting infrastructure services..."
docker-compose -f docker-compose.yml up -d postgres redis kafka

echo "⏳ Waiting for services to be ready..."
sleep 10

# Run migrations
echo "🗄️  Running database migrations..."
npm run migration:run

# Start all services
echo "🚀 Starting all services..."
docker-compose -f docker-compose.yml up -d

# Start monitoring services
echo "📊 Starting monitoring services..."
docker-compose -f docker-compose.monitoring.yml up -d

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📊 Monitoring Dashboards:"
echo "  - Grafana:        http://localhost:3005"
echo "  - Prometheus:     http://localhost:9090"
echo "  - Kibana:         http://localhost:5601"
echo "  - Alertmanager:   http://localhost:9093"
echo ""
echo "🔗 Metrics Endpoints:"
echo "  - API Gateway:    http://localhost:3000/metrics"
echo "  - Auth Service:   http://localhost:3001/metrics"
echo "  - Video Service:  http://localhost:3002/metrics"
echo ""
echo "🛠️  Default Credentials:"
echo "  - Grafana:        admin / admin123"
echo "  - Elasticsearch:  (no auth configured)"
echo ""
