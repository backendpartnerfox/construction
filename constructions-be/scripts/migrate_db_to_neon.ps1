# Dump local Postgres and restore into Neon (or any hosted Postgres).
#
# Prereqs:
#   - psql/pg_dump on PATH (installed with PostgreSQL 16)
#   - Neon project created; copy the connection string from the Neon dashboard
#
# Usage (from PowerShell, in this directory):
#   ./migrate_db_to_neon.ps1
#
# It will:
#   1. pg_dump your local 'postgres' database (schema + data) to a .sql file
#   2. Prompt for the Neon connection string
#   3. Restore into Neon
#
# ------------------------------------------------------------------------------

$ErrorActionPreference = 'Stop'

$PG_BIN = 'C:\Program Files\PostgreSQL\16\bin'
$DUMP_FILE = Join-Path $PSScriptRoot "..\_dump_local.sql"

# --- 1. Dump local ---
$env:PGPASSWORD = 'nopassword'   # matches your local .env
Write-Host "Dumping local Postgres 'postgres' database..." -ForegroundColor Cyan
& "$PG_BIN\pg_dump.exe" `
    -h localhost -U postgres -p 5432 `
    --no-owner --no-privileges --clean --if-exists `
    -f $DUMP_FILE postgres

Write-Host "Dump written to $DUMP_FILE" -ForegroundColor Green
Write-Host "Size: $((Get-Item $DUMP_FILE).Length / 1KB) KB"

# --- 2. Get Neon connection string ---
Write-Host ""
Write-Host "Paste your Neon connection string (starts with postgresql://user:pw@ep-xxx.neon.tech/db?sslmode=require)"
$neonUrl = Read-Host "Neon URL"

if (-not $neonUrl) { throw "Neon URL is required." }

# --- 3. Restore into Neon ---
Write-Host ""
Write-Host "Restoring into Neon..." -ForegroundColor Cyan
& "$PG_BIN\psql.exe" $neonUrl -f $DUMP_FILE

Write-Host ""
Write-Host "Migration complete. Verify with:" -ForegroundColor Green
Write-Host "  psql '$neonUrl' -c 'SELECT count(*) FROM packages;'"
