# RaptorVR updates

The desktop app checks the RaptorVR GitHub release feed at startup, when the
download icon is clicked, and once an hour while running. A newer stable version
downloads automatically. After the download is verified, the app saves its
settings, closes its tracking core, installs over the existing application, and
reopens. Windows can require administrator approval for the per-machine install.
Tracker setup and calibration stay in the existing RaptorVR data folder.

The button shows separate checking, downloading and installing states. An error
offers a retry; repeatedly clicking while a download is active does not start a
second download. The installed app never downloads a SlimeVR installer directly.

## SlimeVR integration

`.github/slimevr-upstream.json` identifies the stable SlimeVR release included in
the app. Hovering over the app version shows this upstream version.

The `Sync stable SlimeVR releases` workflow runs every six hours and can be run
manually from Actions. It checks the official SlimeVR stable release, merges a
newer release into a candidate branch, and advances RaptorVR's version beyond
both its previous version and the upstream release.

The candidate runs the updater regression tests, upstream merge tests, complete
GUI checks, Java formatting checks, tracking-core and desktop tests, and desktop
package builds through the reusable release workflow. Only a successful build
can advance `main` and publish the complete release assets and update manifests.
The release is created as a draft and becomes visible to the app's update feed
only after its assets have been uploaded.

Windows packaging can reuse the native RaptorVR driver from release 20.1.4 only
when its pinned source, build script, overlay and licenses are unchanged. The
archive must match its pinned SHA-256 digest. Changed inputs require a fresh
native build. The tracking core, bindings and GUI are rebuilt for each release.

A conflicting merge or failed check stops publication. The existing app and
release stay available. The failed Actions run identifies the problem; fix the
integration and rerun the workflow. If `main` changes during validation, promotion
also stops so it cannot overwrite newer RaptorVR work.

## Manual releases

Keep `gui/package.json` at a new stable semantic version and push a matching
`vMAJOR.MINOR.PATCH` tag. The release workflow requires GUI checks, Java checks,
tracking tests and all desktop packages before publishing. The Windows
`latest.yml` must reference the NSIS `.exe` payload; the public `.msi` is a separate
installation option. The updater uses the NSIS payload to replace the current
installation.
