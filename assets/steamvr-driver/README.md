# RaptorVR OpenVR driver

RaptorVR builds a native SteamVR/OpenVR driver named `raptorvr` from the
open-source SlimeVR OpenVR Driver v5.0.0 codebase. The build changes the driver
manifest, DLL name, device manufacturer/model properties, settings namespace,
input profiles, localization, status icons, and render model to RaptorVR.

The pinned upstream source is:
https://github.com/SlimeVR/SlimeVR-OpenVR-Driver/releases/tag/v5.0.0

Pinned commit:
`8c82cae7c86c15baf7fb1042e3adc41db0fdf31a`

The internal bridge protocol remains compatible with the RaptorVR tracking core.
See `tools/prepare-steamvr-driver.ps1` for the reproducible Windows build.
