[CmdletBinding()]
param(
    [string]$ArchivePath,
    [string]$DestinationPath
)

$ErrorActionPreference = 'Stop'

$driverVersion = 'v5.0.0'
$driverArchiveUrl = "https://github.com/SlimeVR/SlimeVR-OpenVR-Driver/releases/download/$driverVersion/slimevr-openvr-driver-win64.zip"
$driverArchiveSha256 = '41e349d940b74fe027ca540d27afa3f08781b2ed65599fb755dcf59ffa388f5e'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$overlayPath = Join-Path $repoRoot 'assets\steamvr-driver'

if (-not $DestinationPath) {
    $DestinationPath = Join-Path $repoRoot 'gui\electron\resources\steamvr-driver\slimevr-openvr-driver-win64'
}
$destination = [IO.Path]::GetFullPath($DestinationPath)
$stagingRoot = [IO.Path]::GetFullPath((Join-Path $repoRoot 'gui\electron\resources\steamvr-driver'))
$expectedDestination = [IO.Path]::GetFullPath((Join-Path $stagingRoot 'slimevr-openvr-driver-win64'))

if (-not $destination.Equals($expectedDestination, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to replace unexpected driver staging path: $destination"
}

$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("raptorvr-steamvr-driver-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempRoot | Out-Null

try {
    if ($ArchivePath) {
        $archive = [IO.Path]::GetFullPath($ArchivePath)
    } else {
        $archive = Join-Path $tempRoot 'slimevr-openvr-driver-win64.zip'
        Invoke-WebRequest -Uri $driverArchiveUrl -OutFile $archive
    }

    $archiveHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($archiveHash -ne $driverArchiveSha256) {
        throw "Unexpected OpenVR driver archive checksum: $archiveHash"
    }

    $expandedPath = Join-Path $tempRoot 'expanded'
    Expand-Archive -LiteralPath $archive -DestinationPath $expandedPath
    $upstreamDriver = Join-Path $expandedPath 'slimevr'
    if (-not (Test-Path -LiteralPath (Join-Path $upstreamDriver 'driver.vrdrivermanifest'))) {
        throw 'The OpenVR driver archive does not contain the expected slimevr driver'
    }

    if (Test-Path -LiteralPath $destination) {
        $verifiedDestination = [IO.Path]::GetFullPath($destination)
        if (-not $verifiedDestination.StartsWith($stagingRoot, [StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing to remove driver path outside staging: $verifiedDestination"
        }
        Remove-Item -LiteralPath $verifiedDestination -Recurse -Force
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    Copy-Item -LiteralPath $upstreamDriver -Destination $destination -Recurse

    $driverDll = Join-Path $destination 'bin\win64\driver_slimevr.dll'
    $driverBytes = [IO.File]::ReadAllBytes($driverDll)

    function Replace-AsciiString {
        param(
            [byte[]]$Bytes,
            [string]$OldValue,
            [string]$NewValue
        )

        $oldBytes = [Text.Encoding]::ASCII.GetBytes($OldValue)
        $newBytes = [Text.Encoding]::ASCII.GetBytes($NewValue)
        if ($newBytes.Length -gt $oldBytes.Length) {
            throw "Replacement '$NewValue' is longer than '$OldValue'"
        }

        $matches = [Collections.Generic.List[int]]::new()
        for ($offset = 0; $offset -le $Bytes.Length - $oldBytes.Length; $offset++) {
            $matched = $true
            for ($index = 0; $index -lt $oldBytes.Length; $index++) {
                if ($Bytes[$offset + $index] -ne $oldBytes[$index]) {
                    $matched = $false
                    break
                }
            }
            if ($matched) {
                $matches.Add($offset)
            }
        }

        if ($matches.Count -ne 1) {
            throw "Expected one '$OldValue' string in the driver binary, found $($matches.Count)"
        }

        $match = $matches[0]
        for ($index = 0; $index -lt $oldBytes.Length; $index++) {
            $Bytes[$match + $index] = 0
        }
        [Array]::Copy($newBytes, 0, $Bytes, $match, $newBytes.Length)
    }

    Replace-AsciiString $driverBytes 'SlimeVR Virtual Tracker' 'RaptorVR Tracker'
    Replace-AsciiString $driverBytes '{htc}/rendermodels/vr_tracker_vive_1_0' 'raptorvr_tracker'
    [IO.File]::WriteAllBytes($driverDll, $driverBytes)

    Copy-Item -Path (Join-Path $overlayPath '*') -Destination $destination -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $repoRoot 'LICENSE-MIT') -Destination (Join-Path $destination 'LICENSE-MIT.txt')
    Copy-Item -LiteralPath (Join-Path $repoRoot 'LICENSE-APACHE') -Destination (Join-Path $destination 'LICENSE-APACHE.txt')

    $requiredFiles = @(
        'driver.vrdrivermanifest',
        'bin\win64\driver_slimevr.dll',
        'resources\driver.vrresources',
        'resources\rendermodels\raptorvr_tracker\raptorvr_tracker.json',
        'resources\rendermodels\raptorvr_tracker\raptorvr_tracker.obj',
        'resources\rendermodels\raptorvr_tracker\raptorvr_tracker.mtl',
        'resources\rendermodels\raptorvr_tracker\raptorvr_tracker_thumbnail.png',
        'resources\icons\tracker_status_off.png',
        'resources\icons\tracker_status_ready.png'
    )
    foreach ($requiredFile in $requiredFiles) {
        if (-not (Test-Path -LiteralPath (Join-Path $destination $requiredFile))) {
            throw "Staged RaptorVR SteamVR driver is missing $requiredFile"
        }
    }

    $patchedHash = (Get-FileHash -LiteralPath $driverDll -Algorithm SHA256).Hash.ToLowerInvariant()
    Write-Output "Staged RaptorVR SteamVR driver $driverVersion at $destination"
    Write-Output "Patched driver SHA-256: $patchedHash"
} finally {
    $verifiedTempRoot = [IO.Path]::GetFullPath($tempRoot)
    $systemTempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($verifiedTempRoot.StartsWith($systemTempRoot, [StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $verifiedTempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
