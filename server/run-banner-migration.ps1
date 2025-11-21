# Script para executar a migracao do Banner Builder

Write-Host "Executando migracao: add_banner_builder.sql" -ForegroundColor Cyan

# Carregar variaveis de ambiente
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]*)\s*=\s*(.*)\s*$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { $env:MYSQL_HOST }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { $env:MYSQL_USER }
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { $env:MYSQL_PASSWORD }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { $env:MYSQL_DATABASE }

if (-not $DB_HOST -or -not $DB_USER -or -not $DB_NAME) {
    Write-Host "ERRO: Variaveis de ambiente nao configuradas!" -ForegroundColor Red
    exit 1
}

Write-Host "Conectando ao banco de dados..." -ForegroundColor Yellow
Write-Host "Host: $DB_HOST" -ForegroundColor Gray
Write-Host "Database: $DB_NAME" -ForegroundColor Gray

# Tentar encontrar o mysql.exe
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe"
)

$mysqlExe = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        break
    }
}

if (-not $mysqlExe) {
    Write-Host "ERRO: mysql.exe nao encontrado!" -ForegroundColor Red
    Write-Host "Execute manualmente:" -ForegroundColor Cyan
    Write-Host "mysql -u root -p holywins" -ForegroundColor White
    Write-Host "source server/migrations/add_banner_builder.sql;" -ForegroundColor White
    exit 1
}

Write-Host "MySQL encontrado em: $mysqlExe" -ForegroundColor Green

# Executar migracao
$migrationFile = "migrations\add_banner_builder.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERRO: Arquivo de migracao nao encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Executando migracao..." -ForegroundColor Yellow

if ($DB_PASSWORD) {
    Get-Content $migrationFile | & $mysqlExe -h $DB_HOST -u $DB_USER -p"$DB_PASSWORD" $DB_NAME
} else {
    Get-Content $migrationFile | & $mysqlExe -h $DB_HOST -u $DB_USER $DB_NAME
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Migracao executada com sucesso!" -ForegroundColor Green
    Write-Host "As seguintes colunas foram adicionadas a tabela banners:" -ForegroundColor Green
    Write-Host "  - background_image (VARCHAR 255)" -ForegroundColor Gray
    Write-Host "  - components (JSON)" -ForegroundColor Gray
    Write-Host "  - is_draft (BOOLEAN)" -ForegroundColor Gray
    Write-Host "  - is_published (BOOLEAN)" -ForegroundColor Gray
    Write-Host "  - updated_at (TIMESTAMP)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Reinicie o servidor para aplicar as alteracoes." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Erro ao executar migracao!" -ForegroundColor Red
}
