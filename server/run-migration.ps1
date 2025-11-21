# Script para executar a migração de coordenadas
# Certifique-se de que o arquivo .env está configurado corretamente

Write-Host "Executando migração: add_communities_coordinates.sql" -ForegroundColor Cyan

# Carregar variáveis de ambiente
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]*)\s*=\s*(.*)\s*$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$DB_HOST = $env:DB_HOST
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD
$DB_NAME = $env:DB_NAME

if (-not $DB_HOST -or -not $DB_USER -or -not $DB_NAME) {
    Write-Host "ERRO: Variáveis de ambiente não configuradas!" -ForegroundColor Red
    Write-Host "Certifique-se de que o arquivo .env existe e contém:" -ForegroundColor Yellow
    Write-Host "  DB_HOST=localhost" -ForegroundColor Yellow
    Write-Host "  DB_USER=root" -ForegroundColor Yellow
    Write-Host "  DB_PASSWORD=sua_senha" -ForegroundColor Yellow
    Write-Host "  DB_NAME=holywins_db" -ForegroundColor Yellow
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
    Write-Host "ERRO: mysql.exe não encontrado!" -ForegroundColor Red
    Write-Host "Instale o MySQL ou adicione-o ao PATH do sistema." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternativamente, execute manualmente no MySQL:" -ForegroundColor Cyan
    Write-Host "mysql -u $DB_USER -p $DB_NAME < server/add_communities_coordinates.sql" -ForegroundColor White
    exit 1
}

Write-Host "MySQL encontrado em: $mysqlExe" -ForegroundColor Green

# Executar migração
if ($DB_PASSWORD) {
    & $mysqlExe -h $DB_HOST -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "source server/add_communities_coordinates.sql"
} else {
    & $mysqlExe -h $DB_HOST -u $DB_USER $DB_NAME -e "source server/add_communities_coordinates.sql"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Migração executada com sucesso!" -ForegroundColor Green
    Write-Host "As colunas latitude e longitude foram adicionadas à tabela communities." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✗ Erro ao executar migração!" -ForegroundColor Red
    Write-Host "Execute manualmente:" -ForegroundColor Yellow
    Write-Host "mysql -u $DB_USER -p $DB_NAME < server/add_communities_coordinates.sql" -ForegroundColor White
}
