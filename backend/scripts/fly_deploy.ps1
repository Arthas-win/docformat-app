param(
    [Parameter(Mandatory = $true)]
    [string]$DatabaseUrl,

    [Parameter(Mandatory = $true)]
    [string]$DjangoSecretKey,

    [string]$AllowedHosts = "docformat-backend.fly.dev",
    [string]$AppName = "docformat-backend",
    [string]$Region = "waw"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir
Set-Location $backendDir

fly status --app $AppName | Out-Null
if ($LASTEXITCODE -ne 0) {
    fly launch --name $AppName --region $Region --no-deploy
}

fly secrets set DATABASE_URL="$DatabaseUrl" SECRET_KEY="$DjangoSecretKey" ALLOWED_HOSTS="$AllowedHosts" DEBUG="False" --app $AppName
fly deploy --app $AppName