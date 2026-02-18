# Quick Seed Script for TikTok Clone
# This script sets up the database environment and seeds all data

Write-Host "🚀 TikTok Clone - Database Setup and Seeding" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists, if not copy from example
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "📋 Creating .env from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
    } else {
        Write-Host "❌ No .env.example found. Please create .env file manually." -ForegroundColor Red
        exit 1
    }
}

# Check if Docker is running
Write-Host "🐳 Checking Docker..." -ForegroundColor Yellow
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Start infrastructure
Write-Host "🔧 Starting infrastructure services..." -ForegroundColor Yellow
docker compose -f docker-compose.infra.yml up -d postgres redis
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start infrastructure" -ForegroundColor Red
    exit 1
}

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    $attempt++
    docker exec tiktok_postgres pg_isready -U postgres 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        break
    }
    Start-Sleep -Seconds 2
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "❌ PostgreSQL did not become ready in time" -ForegroundColor Red
    exit 1
}
Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
Write-Host ""

# Run migrations for all services
Write-Host "📦 Running database migrations..." -ForegroundColor Yellow
npm run migration:all:run
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Migrations may have warnings, but continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Seed all databases
Write-Host "🌱 Seeding databases with demo data..." -ForegroundColor Yellow
npm run seed:all
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Seeding failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 You can now:" -ForegroundColor Cyan
Write-Host "   1. Start all services: npm run start:dev" -ForegroundColor White
Write-Host "   2. Or start individual services:" -ForegroundColor White
Write-Host "      - npm run start:gateway" -ForegroundColor Gray
Write-Host "      - npm run start:auth" -ForegroundColor Gray
Write-Host "      - npm run start:video" -ForegroundColor Gray
Write-Host "      - npm run start:interaction" -ForegroundColor Gray
Write-Host "      - npm run start:notification" -ForegroundColor Gray
Write-Host ""
Write-Host "🔑 Demo Credentials:" -ForegroundColor Cyan
Write-Host "   Email: demo@tiktok.local" -ForegroundColor White
Write-Host "   Password: Password123!" -ForegroundColor White
Write-Host ""
Write-Host "📚 Access services at:" -ForegroundColor Cyan
Write-Host "   - API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "   - Swagger Docs: http://localhost:3000/api" -ForegroundColor White
Write-Host "   - pgAdmin: http://localhost:5050" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
