package dev.slimevr.desktop.install.drivers

import com.sun.jna.platform.win32.WinReg
import dev.slimevr.desktop.games.vrchat.RegEditWindows
import io.eiren.util.logging.LogManager
import java.io.File

class Windows {

	val path: String = System.getProperty("user.dir")

	fun updateWindows() {
		steamVRDriver()
	}

	fun steamVRDriver() {
		val regEdit = RegEditWindows()
		val regQuery = regEdit.getKeyByPath(WinReg.HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 250820")
		val steamVRLocation = regQuery["InstallLocation"]
		if (steamVRLocation == null || !steamVRLocation.contains("SteamVR")) {
			LogManager.warning("Can't find SteamVR, unable to install SteamVR driver")
			return
		}

		val pathRegPath = "${steamVRLocation}\\bin\\win64\\vrpathreg.exe"
		val bundledDriver = File(path, WINDOWS_STEAMVR_DRIVER_DIRECTORY).canonicalFile
		val manifest = File(bundledDriver, "driver.vrdrivermanifest")
		if (!manifest.isFile) {
			LogManager.warning("Bundled RaptorVR SteamVR driver is missing, unable to install it")
			return
		}

		removeLegacyRaptorDriver(pathRegPath)

		val vrPathRegContents = executeShellCommand(pathRegPath, "finddriver", STEAMVR_DRIVER_NAME)
		if (vrPathRegContents == null) {
			LogManager.warning("Error installing SteamVR driver")
			return
		}

		val installedDriver = vrPathRegContents.trim()
		if (installedDriver.equals(bundledDriver.path, ignoreCase = true)) {
			LogManager.info("RaptorVR SteamVR driver is already installed")
			return
		}

		if (installedDriver.isNotEmpty()) {
			LogManager.info("Replacing the existing SteamVR tracker driver with the bundled RaptorVR driver")
			executeShellCommand(pathRegPath, "removedriverswithname", STEAMVR_DRIVER_NAME)
		}

		executeShellCommand(pathRegPath, "adddriver", bundledDriver.path)

		val verifiedDriver = executeShellCommand(pathRegPath, "finddriver", STEAMVR_DRIVER_NAME)?.trim()
		if (!verifiedDriver.equals(bundledDriver.path, ignoreCase = true)) {
			LogManager.warning("Failed to install RaptorVR SteamVR driver")
			return
		}
		LogManager.info("RaptorVR SteamVR driver successfully installed")
	}

	private fun removeLegacyRaptorDriver(pathRegPath: String) {
		val legacyDriverPath = executeShellCommand(pathRegPath, "finddriver", LEGACY_STEAMVR_DRIVER_NAME)
			?.trim()
			.orEmpty()
		if (legacyDriverPath.isEmpty()) return

		val legacyDriver = File(legacyDriverPath).canonicalFile
		val raptorRenderModel = File(
			legacyDriver,
			"resources/rendermodels/raptorvr_tracker/raptorvr_tracker.json",
		)
		if (!raptorRenderModel.isFile) {
			LogManager.info("Leaving the separate SlimeVR SteamVR driver unchanged")
			return
		}

		LogManager.info("Removing the legacy SlimeVR-named RaptorVR SteamVR driver")
		executeShellCommand(pathRegPath, "removedriver", legacyDriver.path)
		val remainingLegacyDriver = executeShellCommand(
			pathRegPath,
			"finddriver",
			LEGACY_STEAMVR_DRIVER_NAME,
		)
			?.trim()
			.orEmpty()
		if (remainingLegacyDriver.equals(legacyDriver.path, ignoreCase = true)) {
			LogManager.warning("Unable to remove the legacy SlimeVR-named RaptorVR driver")
		}
	}

	companion object {
		private const val STEAMVR_DRIVER_NAME = "raptorvr"
		private const val LEGACY_STEAMVR_DRIVER_NAME = "slimevr"
		private const val WINDOWS_STEAMVR_DRIVER_DIRECTORY = "raptorvr-openvr-driver-win64"
	}
}
