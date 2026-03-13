param(
    [string]$DatabaseUrl = "",

    [Parameter(Mandatory = $true)]
    [string]$DjangoSecretKey,

    [string]$AllowedHosts = "",
    [string]$AppName = "docformat-backend",
    [string]$Region = "waw"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir
Set-Location $backendDir

if (-not $AllowedHosts) {
    $AllowedHosts = "$AppName.fly.dev"
}

fly status --app $AppName | Out-Null
if ($LASTEXITCODE -ne 0) {
    fly launch --name $AppName --region $Region --no-deploy
}

if ($DatabaseUrl) {
    fly secrets set DATABASE_URL="$DatabaseUrl" SECRET_KEY="$DjangoSecretKey" ALLOWED_HOSTS="$AllowedHosts" DEBUG="False" --app $AppName
}
else {
    fly secrets set SECRET_KEY="$DjangoSecretKey" ALLOWED_HOSTS="$AllowedHosts" DEBUG="False" --app $AppName
}
fly deploy --app $AppName