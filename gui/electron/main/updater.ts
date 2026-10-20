import { app, BrowserWindow } from 'electron';
import electronUpdater, {
  type AppUpdater,
  type ProgressInfo,
  type UpdateInfo,
} from 'electron-updater';
import { IPC_CHANNELS } from '../shared';
import type { AppUpdateStatus } from '../preload/interface';
import { handleIpc } from './utils';
import { logger } from './logger';

const { autoUpdater } = electronUpdater as unknown as { autoUpdater: AppUpdater };

let status: AppUpdateStatus = { state: 'idle' };
let availableVersion = '';
let checkPromise: Promise<unknown> | null = null;
let installPromise: Promise<void> | null = null;

const AUTO_INSTALL_DELAY_MS = 1500;
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

function cleanErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/https?:\/\/[^\s]+/g, 'the update service').slice(0, 240);
}

export function initializeAppUpdater(
  getWindow: () => BrowserWindow | null,
  prepareForInstall: () => Promise<void>
) {
  const publish = (nextStatus: AppUpdateStatus) => {
    status = nextStatus;
    const window = getWindow();
    if (window && !window.webContents.isDestroyed()) {
      window.webContents.send(IPC_CHANNELS.UPDATER_STATUS, nextStatus);
    }
  };

  const updaterSupported = app.isPackaged;

  const installDownloadedUpdate = async () => {
    if (installPromise) {
      await installPromise;
      return;
    }
    if (!updaterSupported || status.state !== 'downloaded') return;

    installPromise = (async () => {
      publish({ state: 'installing', version: availableVersion });
      await prepareForInstall();
      autoUpdater.quitAndInstall(true, true);
    })();

    try {
      await installPromise;
    } catch (error) {
      logger.error({ err: error }, 'Unable to install application update');
      publish({ state: 'error', message: cleanErrorMessage(error) });
    } finally {
      installPromise = null;
    }
  };

  if (updaterSupported) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.autoRunAppAfterInstall = true;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on('checking-for-update', () => publish({ state: 'checking' }));
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      availableVersion = info.version;
      publish({ state: 'available', version: info.version });
    });
    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      availableVersion = '';
      publish({ state: 'not-available', version: info.version || app.getVersion() });
    });
    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      publish({
        state: 'downloading',
        version: availableVersion,
        percent: Math.max(0, Math.min(100, progress.percent)),
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond,
      });
    });
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      availableVersion = info.version;
      publish({ state: 'downloaded', version: info.version });
      setTimeout(() => {
        void installDownloadedUpdate();
      }, AUTO_INSTALL_DELAY_MS);
    });
    autoUpdater.on('error', (error: Error) => {
      logger.error({ err: error }, 'Application update failed');
      publish({ state: 'error', message: cleanErrorMessage(error) });
    });
  } else {
    status = {
      state: 'unsupported',
      message: 'Update installation is available in packaged Raptor VR builds.',
    };
  }

  const checkForUpdates = async () => {
    if (!updaterSupported) {
      publish(status);
      return;
    }
    // A second click must not reset an active download or launch another check.
    if (
      ['available', 'downloading', 'downloaded', 'installing'].includes(status.state)
    ) {
      publish(status);
      return;
    }
    if (checkPromise) {
      await checkPromise.catch(() => undefined);
      return;
    }

    checkPromise = Promise.resolve().then(() => autoUpdater.checkForUpdates());
    try {
      await checkPromise;
    } catch (error) {
      logger.error({ err: error }, 'Unable to check for application updates');
      publish({ state: 'error', message: cleanErrorMessage(error) });
    } finally {
      checkPromise = null;
    }
  };

  handleIpc(IPC_CHANNELS.UPDATER_GET_STATUS, () => status);
  handleIpc(IPC_CHANNELS.UPDATER_CHECK, checkForUpdates);
  // autoDownload owns downloads, including calls through the legacy IPC method.
  handleIpc(IPC_CHANNELS.UPDATER_DOWNLOAD, checkForUpdates);
  handleIpc(IPC_CHANNELS.UPDATER_INSTALL, async () => {
    await installDownloadedUpdate();
  });

  if (updaterSupported) {
    const timer = setInterval(() => {
      void checkForUpdates();
    }, UPDATE_CHECK_INTERVAL_MS);
    timer.unref();
    app.once('before-quit', () => clearInterval(timer));
  }
}
