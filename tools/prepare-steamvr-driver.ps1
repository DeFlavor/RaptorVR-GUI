[CmdletBinding()]
param(
    [string]$DestinationPath
)

$ErrorActionPreference = 'Stop'

$driverVersion = 'v5.0.0'
$driverCommit = '8c82cae7c86c15baf7fb1042e3adc41db0fdf31a'
$driverRepository = 'https://github.com/SlimeVR/SlimeVR-OpenVR-Driver.git'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$overlayPath = Join-Path $repoRoot 'assets\steamvr-driver'
$stagingRoot = [IO.Path]::GetFullPath(
    (Join-Path $repoRoot 'gui\electron\resources\steamvr-driver')
)

if (-not $DestinationPath) {
    $DestinationPath = Join-Path $stagingRoot 'raptorvr-openvr-driver-win64'
}

$destination = [IO.Path]::GetFullPath($DestinationPath)
$expectedDestination = [IO.Path]::GetFullPath(
    (Join-Path $stagingRoot 'raptorvr-openvr-driver-win64')
)

if (-not $destination.Equals($expectedDestination, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to replace unexpected driver staging path: $destination"
}

$tempRoot = Join-Path (
    [IO.Path]::GetTempPath()
) ("raptorvr-openvr-driver-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempRoot | Out-Null

function Replace-Text {
    param(
        [Parameter(Mandatory)]
        [string]$Path,
        [Parameter(Mandatory)]
        [string]$OldValue,
        [Parameter(Mandatory)]
        [string]$NewValue
    )

    $contents = [IO.File]::ReadAllText($Path)
    if ($contents.IndexOf($OldValue, [StringComparison]::Ordinal) -lt 0) {
        throw "Expected text '$OldValue' was not found in $Path"
    }
    [IO.File]::WriteAllText(
        $Path,
        $contents.Replace($OldValue, $NewValue),
        [Text.UTF8Encoding]::new($false)
    )
}

try {
    $source = Join-Path $tempRoot 'source'
    git clone --branch $driverVersion --depth 1 --recurse-submodules --shallow-submodules $driverRepository $source
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to clone the pinned OpenVR driver source'
    }

    $checkedOutCommit = (git -C $source rev-parse HEAD).Trim()
    if ($checkedOutCommit -ne $driverCommit) {
        throw "Unexpected OpenVR driver source commit: $checkedOutCommit"
    }

    $cmakeFile = Join-Path $source 'CMakeLists.txt'
    Replace-Text $cmakeFile 'project(SlimeVR-OpenVR-Driver VERSION 0.2.0)' 'project(RaptorVR-OpenVR-Driver VERSION 5.0.0)'
    Replace-Text $cmakeFile 'set(DRIVER_NAME "slimevr")' 'set(DRIVER_NAME "raptorvr")'

    $trackerSource = Join-Path $source 'src\TrackerDevice.cpp'
    Replace-Text $trackerSource 'vr::Prop_ManufacturerName_String, "SlimeVR"' 'vr::Prop_ManufacturerName_String, "RaptorVR"'
    Replace-Text $trackerSource 'vr::Prop_ModelNumber_String, "SlimeVR Virtual Tracker"' 'vr::Prop_ModelNumber_String, "RaptorVR Tracker"'
    Replace-Text $trackerSource 'vr::Prop_RenderModelName_String, "{htc}/rendermodels/vr_tracker_vive_1_0"' 'vr::Prop_RenderModelName_String, "raptorvr_tracker"'
    Replace-Text $trackerSource 'VRSettings()->GetBool("driver_slimevr", "emulateVives")' 'VRSettings()->GetBool("driver_raptorvr", "emulateVives")'
    Replace-Text $trackerSource '"{slimevr}/input/slimevr_tracker_profile.json"' '"{raptorvr}/input/raptorvr_tracker_profile.json"'
    Replace-Text $trackerSource '"/devices/slimevr/"' '"/devices/raptorvr/"'

    $driverHeader = Join-Path $source 'src\VRDriver.hpp'
    Replace-Text $driverHeader 'std::string settings_key_ = "driver_slimevr";' 'std::string settings_key_ = "driver_raptorvr";'

    $driverSource = Join-Path $source 'src\VRDriver.cpp'
    Replace-Text $driverSource 'Activating SlimeVR Driver...' 'Activating RaptorVR Driver...'
    Replace-Text $driverSource 'SlimeVR Driver Loaded Successfully' 'RaptorVR Driver Loaded Successfully'
    Replace-Text $driverSource 'if (driver_name == "slimevr" || driver_name == "standable")' 'if (driver_name == "raptorvr" || driver_name == "slimevr" || driver_name == "standable")'

    $upstreamDriver = Join-Path $source 'driver\slimevr'
    $raptorDriver = Join-Path $source 'driver\raptorvr'
    Move-Item -LiteralPath $upstreamDriver -Destination $raptorDriver

    Copy-Item -Path (Join-Path $overlayPath 'resources\*') -Destination (Join-Path $raptorDriver 'resources') -Recurse -Force

    $resourceFiles = Get-ChildItem -LiteralPath (Join-Path $raptorDriver 'resources') -Recurse -File |
        Where-Object { $_.Extension -in @('.json', '.vrsettings', '.vrresources') }
    foreach ($resourceFile in $resourceFiles) {
        $contents = [IO.File]::ReadAllText($resourceFile.FullName)
        $contents = $contents.Replace('SlimeVR', 'RaptorVR')
        $contents = $contents.Replace('slimevr', 'raptorvr')
        [IO.File]::WriteAllText(
            $resourceFile.FullName,
            $contents,
            [Text.UTF8Encoding]::new($false)
        )
    }

    $renamedResources = Get-ChildItem -LiteralPath (Join-Path $raptorDriver 'resources') -Recurse -File |
        Where-Object { $_.Name -like '*slimevr*' } |
        Sort-Object { $_.FullName.Length } -Descending
    foreach ($resourceFile in $renamedResources) {
        Rename-Item -LiteralPath $resourceFile.FullName -NewName (
            $resourceFile.Name.Replace('slimevr', 'raptorvr')
        )
    }

    $manifest = Join-Path $raptorDriver 'driver.vrdrivermanifest'
    Replace-Text $manifest '"name" : "slimevr"' '"name" : "raptorvr"'

    $vcpkg = Join-Path $source 'vcpkg\vcpkg.exe'
    & (Join-Path $source 'vcpkg\bootstrap-vcpkg.bat') -disableMetrics
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $vcpkg)) {
        throw 'Unable to bootstrap the pinned vcpkg toolchain'
    }

    $build = Join-Path $tempRoot 'build'
    cmake -S $source -B $build "-DCMAKE_TOOLCHAIN_FILE=$(Join-Path $source 'vcpkg\scripts\buildsystems\vcpkg.cmake')" -DVCPKG_TARGET_TRIPLET=x64-windows-static-md
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to configure the RaptorVR OpenVR driver'
    }
    cmake --build $build --config Release --target RaptorVR-OpenVR-Driver --parallel 6
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to compile the RaptorVR OpenVR driver'
    }

    $builtDriver = Join-Path $build 'Release\driver\raptorvr'
    $builtDll = Join-Path $builtDriver 'bin\win64\driver_raptorvr.dll'
    if (-not (Test-Path -LiteralPath $builtDll)) {
        throw 'The compiled RaptorVR OpenVR driver DLL was not produced'
    }

    if (Test-Path -LiteralPath $destination) {
        $verifiedDestination = [IO.Path]::GetFullPath($destination)
        if (-not $verifiedDestination.StartsWith($stagingRoot, [StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing to remove driver path outside staging: $verifiedDestination"
        }
        Remove-Item -LiteralPath $verifiedDestination -Recurse -Force
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    Copy-Item -LiteralPath $builtDriver -Destination $destination -Recurse
    Copy-Item -LiteralPath (Join-Path $repoRoot 'LICENSE-MIT') -Destination (Join-Path $destination 'LICENSE-MIT.txt')
    Copy-Item -LiteralPath (Join-Path $repoRoot 'LICENSE-APACHE') -Destination (Join-Path $destination 'LICENSE-APACHE.txt')
    Copy-Item -LiteralPath (Join-Path $overlayPath 'README.md') -Destination (Join-Path $destination 'README.md')

    $requiredFiles = @(
        'driver.vrdrivermanifest',
        'bin\win64\driver_raptorvr.dll',
        'resources\driver.vrresources',
        'resources\input\raptorvr_tracker_profile.json',
        'resources\settings\default.vrsettings',
        'resources\rendermodels\raptorvr_tracker\raptorvr_tracker.json',
        'resources\rendermodels\raptorvr_tracker\raptorvr_tracker.obj',
        'resources\rendermodels\raptorvr_tracker\raptorvr_tracker.mtl',
        'resources\rendermodels\raptorvr_tracker\raptorvr_tracker_thumbnail.png',
        'resources\icons\tracker_status_off.png',
        'resources\icons\tracker_status_ready.png'
    )
    foreach ($requiredFile in $requiredFiles) {
        if (-not (Test-Path -LiteralPath (Join-Path $destination $requiredFile))) {
            throw "Staged RaptorVR OpenVR driver is missing $requiredFile"
        }
    }

    $manifestJson = Get-Content -LiteralPath (Join-Path $destination 'driver.vrdrivermanifest') -Raw | ConvertFrom-Json
    if ($manifestJson.name -ne 'raptorvr') {
        throw "Unexpected OpenVR driver manifest name: $($manifestJson.name)"
    }

    $dllHash = (Get-FileHash -LiteralPath (Join-Path $destination 'bin\win64\driver_raptorvr.dll') -Algorithm SHA256).Hash.ToLowerInvariant()
    Write-Output "Staged native RaptorVR OpenVR driver from $driverVersion at $destination"
    Write-Output "RaptorVR driver SHA-256: $dllHash"
} finally {
    $verifiedTempRoot = [IO.Path]::GetFullPath($tempRoot)
    $systemTempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
    if ($verifiedTempRoot.StartsWith($systemTempRoot, [StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $verifiedTempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
