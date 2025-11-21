# PowerShell script to run the users migration
# Run this script from the server directory

Write-Host "Running users table migration..." -ForegroundColor Cyan

# Load environment variables from parent directory
$parentDir = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $parentDir ".env"
if (Test-Path $envPath) {
    Write-Host "Loading environment from: $envPath" -ForegroundColor Gray
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "Warning: .env file not found at $envPath" -ForegroundColor Yellow
}

# Get database credentials from environment
$DB_HOST = $env:MYSQL_HOST
$DB_USER = $env:MYSQL_USER
$DB_PASSWORD = $env:MYSQL_PASSWORD
$DB_NAME = $env:MYSQL_DATABASE

if (-not $DB_HOST -or -not $DB_USER -or -not $DB_NAME) {
    Write-Host "Error: Database credentials not found in .env file" -ForegroundColor Red
    Write-Host "Looking for: MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE" -ForegroundColor Yellow
    exit 1
}

Write-Host "Connecting to: $DB_HOST as $DB_USER to database $DB_NAME" -ForegroundColor Gray

# Build mysql command
$mysqlCmd = "mysql -h $DB_HOST -u $DB_USER"
if ($DB_PASSWORD) {
    $mysqlCmd += " -p$DB_PASSWORD"
}
$mysqlCmd += " $DB_NAME < migrations\create_users_table.sql"

Write-Host "Executing migration..." -ForegroundColor Yellow
Invoke-Expression $mysqlCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Default admin credentials:" -ForegroundColor Cyan
    Write-Host "  Username: admin" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANT: Change the admin password after first login!" -ForegroundColor Yellow
} else {
    Write-Host "Migration failed!" -ForegroundColor Red
    exit 1
}
