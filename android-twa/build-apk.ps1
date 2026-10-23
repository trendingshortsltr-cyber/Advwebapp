$ErrorActionPreference = "Stop"

$passwordFile = Join-Path $HOME ".bubblewrap\advdiary-signing-password.dpapi"
if (-not (Test-Path -LiteralPath $passwordFile)) {
  throw "Signing password is unavailable for this Windows account."
}

if (-not (Get-Command bubblewrap -ErrorAction SilentlyContinue)) {
  throw "Bubblewrap CLI is not installed. Install it with: npm install --global @bubblewrap/cli"
}

$encryptedPassword = (Get-Content -LiteralPath $passwordFile -Raw).Trim()
$securePassword = ConvertTo-SecureString -String $encryptedPassword
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$buildExitCode = 1

try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $env:BUBBLEWRAP_KEYSTORE_PASSWORD = $password
  $env:BUBBLEWRAP_KEY_PASSWORD = $password
  Push-Location $PSScriptRoot
  try {
    & bubblewrap build --manifest="twa-manifest.json"
    $buildExitCode = $LASTEXITCODE
  }
  finally {
    Pop-Location
  }
}
finally {
  Remove-Item Env:BUBBLEWRAP_KEYSTORE_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:BUBBLEWRAP_KEY_PASSWORD -ErrorAction SilentlyContinue
  $password = $null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  $securePassword.Dispose()
}

if ($buildExitCode -ne 0) {
  exit $buildExitCode
}
