#!/usr/bin/env pwsh
# Verify Monitoring Stack Status

Write-Host "🔍 Checking Monitoring Stack Health..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{ name = "Prometheus"; url = "http://localhost:9090/-/healthy"; port = 9090 }
    @{ name = "Grafana"; url = "http://localhost:3005/api/health"; port = 3005 }
    @{ name = "Elasticsearch"; url = "http://localhost:9200/_cluster/health"; port = 9200 }
    @{ name = "Kibana"; url = "http://localhost:5601/api/status"; port = 5601 }
    @{ name = "Loki"; url = "http://localhost:3100/ready"; port = 3100 }
    @{ name = "Jaeger"; url = "http://localhost:16686/api/health"; port = 16686 }
    @{ name = "Alertmanager"; url = "http://localhost:9093/-/healthy"; port = 9093 }
    @{ name = "Sentry"; url = "http://localhost:9000/_health/"; port = 9000 }
)

$results = @()

foreach ($service in $services) {
    Write-Host "Testing $($service.name)..." -NoNewline

    try {
        $response = Invoke-WebRequest -Uri $service.url -TimeoutSec 5 -SkipHttpErrorCheck
        if ($response.StatusCode -in 200..299) {
            Write-Host " ✅" -ForegroundColor Green
            $results += @{ service = $service.name; status = "✅ Healthy"; port = $service.port }
        } else {
            Write-Host " ⚠️ (Code: $($response.StatusCode))" -ForegroundColor Yellow
            $results += @{ service = $service.name; status = "⚠️ Degraded"; port = $service.port }
        }
    } catch {
        Write-Host " ❌" -ForegroundColor Red
        $results += @{ service = $service.name; status = "❌ Down"; port = $service.port }
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 Monitoring Stack Status Summary" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

$results | ForEach-Object {
    if ($_.status -like "*✅*") {
        Write-Host "$($_.service):$($_.port) → $($_.status)" -ForegroundColor Green
    } elseif ($_.status -like "*⚠️*") {
        Write-Host "$($_.service):$($_.port) → $($_.status)" -ForegroundColor Yellow
    } else {
        Write-Host "$($_.service):$($_.port) → $($_.status)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔗 Quick Access URLs:" -ForegroundColor Cyan
Write-Host "  📈 Grafana:       http://localhost:3005" -ForegroundColor White
Write-Host "  🔍 Prometheus:    http://localhost:9090" -ForegroundColor White
Write-Host "  📝 Kibana:        http://localhost:5601" -ForegroundColor White
Write-Host "  🔗 Jaeger:        http://localhost:16686" -ForegroundColor White
Write-Host "  ⚠️  Alertmanager:  http://localhost:9093" -ForegroundColor White
Write-Host "  🐛 Sentry:        http://localhost:9000" -ForegroundColor White
Write-Host ""

# Check Docker containers
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🐳 Docker Container Status" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$containers = docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String -Pattern "(prometheus|grafana|elasticsearch|kibana|loki|jaeger|alertmanager|sentry|logstash|promtail)"

if ($containers) {
    Write-Host $containers
} else {
    Write-Host "No monitoring containers running. Start with:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose.monitoring.yml up -d" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Verification Complete!" -ForegroundColor Green
