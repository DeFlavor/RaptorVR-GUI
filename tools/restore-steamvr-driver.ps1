[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseTag = 'v20.1.4'
$archiveHash = '2a1c7cb489999a0bff26f456bae39811f0e9652815170f08cde699fc33dcf383'
$archiveUrl = "https://github.com/DeFlavor/RaptorVR-GUI/releases/download/$releaseTag/Raptor-VR-GUI-Windows-x64.zip"

# This release built the same pinned driver from source. Reuse is allowed only
# while every input to that build remains identical, including the overlay.
git -C $repoRoot diff --quiet $releaseTag -- tools/prepare-steamvr-driver.ps1 assets/steamvr-driver LICENSE-MIT LICENSE-APACHE
if ($LASTEXITCODE -eq 1) {
    Write-Output 'Driver inputs changed; a fresh native build is required.'
    if ($env:GITHUB_OUTPUT) { Add-Content -LiteralPath $env:GITHUB_OUTPUT -Value 'reused=false' }
    exit 0
}
if ($LASTEXITCODE -ne 0) { throw 'Unable to compare the pinned driver build inputs' }

$stagingRoot = [IO.Path]::GetFullPath((Join-Path $repoRoot 'gui/electron/resources/steamvr-driver'))
$destination = Join-Path $stagingRoot 'raptorvr-openvr-driver-win64'
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('raptorvr-driver-reuse-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempRoot | Out-Null
try {
    $archive = Join-Path $tempRoot 'release.zip'
    Invoke-WebRequest -Uri $archiveUrl -OutFile $archive -UseBasicParsing
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $archiveHash) {
        throw 'The pinned driver archive failed SHA-256 verification'
    }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($archive)
    try {
        $prefix = 'raptorvr-openvr-driver-win64/'
        $driverEntries = @($zip.Entries | Where-Object { $_.FullName.StartsWith($prefix, [StringComparison]::Ordinal) -and $_.Name })
        if ($driverEntries.Count -eq 0) { throw 'The verified archive contains no RaptorVR driver' }
        foreach ($entry in $driverEntries) {
            $target = [IO.Path]::GetFullPath((Join-Path $destination $entry.FullName.Substring($prefix.Length)))
            if (-not $target.StartsWith($destination + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
                throw 'Driver archive entry is outside the staging directory'
            }
            New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
            [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true)
        }
    } finally { $zip.Dispose() }
    $manifest = Get-Content -LiteralPath (Join-Path $destination 'driver.vrdrivermanifest') -Raw | ConvertFrom-Json
    if ($manifest.name -ne 'raptorvr') { throw 'Unexpected driver manifest in the verified archive' }
    $dll = Join-Path $destination 'bin/win64/driver_raptorvr.dll'
    if (-not (Test-Path -LiteralPath $dll)) { throw 'The verified archive is missing the native driver' }
    Write-Output "Reused unchanged native RaptorVR driver from verified release $releaseTag"
    Write-Output "RaptorVR driver SHA-256: $((Get-FileHash -LiteralPath $dll -Algorithm SHA256).Hash.ToLowerInvariant())"
    if ($env:GITHUB_OUTPUT) { Add-Content -LiteralPath $env:GITHUB_OUTPUT -Value 'reused=true' }
} finally {
    $verifiedTempRoot = [IO.Path]::GetFullPath($tempRoot)
    $systemTempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($verifiedTempRoot.StartsWith((Join-Path $systemTempRoot 'raptorvr-driver-reuse-'), [StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $verifiedTempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
