param(
    [Parameter(Mandatory = $true)]
    [string]$DjangoSecretKey,

    [string]$AppName = "docformat-backend",
    [string]$Region = "waw",
    [string]$AllowedHosts = "",
    [string]$DatabaseUrl = "",
    [string]$DbAppName = "",
    [switch]$CreateDb
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir
Set-Location $backendDir

if (-not $AllowedHosts) {
    $AllowedHosts = "$AppName.fly.dev"
}

fly auth whoami | Out-Null

fly status --app $AppName | Out-Null
if ($LASTEXITCODE -ne 0) {
    fly launch --name $AppName --region $Region --no-deploy
}

if ($DatabaseUrl) {
    fly secrets set DATABASE_URL="$DatabaseUrl" --app $AppName
}
elseif ($DbAppName) {
    fly postgres attach $DbAppName --app $AppName
}
elseif ($CreateDb) {
    $generatedDbName = "$AppName-db"
    fly status --app $generatedDbName | Out-Null
    if ($LASTEXITCODE -ne 0) {
        fly postgres create --name $generatedDbName --region $Region
    }
    fly postgres attach $generatedDbName --app $AppName
}
else {
    Write-Host "DATABASE_URL was not provided. Using existing DATABASE_URL secret if already set." -ForegroundColor Yellow
}

fly secrets set SECRET_KEY="$DjangoSecretKey" ALLOWED_HOSTS="$AllowedHosts" DEBUG="False" --app $AppName
fly deploy --app $AppName