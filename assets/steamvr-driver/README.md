# RaptorVR SteamVR driver overlay

This directory contains the RaptorVR render model and status resources layered
over the official SlimeVR OpenVR Driver v5.0.0 during packaging.

The packaged driver binary comes from:
https://github.com/SlimeVR/SlimeVR-OpenVR-Driver/releases/tag/v5.0.0

Expected Windows archive SHA-256:
`41e349d940b74fe027ca540d27afa3f08781b2ed65599fb755dcf59ffa388f5e`

The binary keeps the upstream `slimevr` driver and protocol identifiers for
compatibility. The packaging script changes only its displayed model name and
render-model reference, then copies the resources from this directory.
