import { useLocalization } from '@fluent/react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { BaseModal } from './commons/BaseModal';
import { Button } from './commons/Button';
import { Typography } from './commons/Typography';
import semver from 'semver';
import { GH_REPO, VersionContext } from '@/App';
import { error } from '@/utils/logging';
import { useElectron } from '@/hooks/electron';
import { openUrl } from '@/hooks/crossplatform';
import type { AppUpdateStatus } from '../../electron/preload/interface';
import { appUpdateAction } from '@/utils/app-updates';

const CHECK_FOR_UPDATES_EVENT = 'raptorvr-check-for-updates';

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const precision = bytes >= 10 * 1024 * 1024 ? 0 : 1;
  return `${(bytes / (1024 * 1024)).toFixed(precision)} MB`;
}

export function VersionUpdateModal() {
  const electron = useElectron();
  const electronApi = electron.isElectron ? electron.api : null;
  const { l10n } = useLocalization();
  const newVersion = useContext(VersionContext);
  const [forceClose, setForceClose] = useState(false);
  const [manualCheck, setManualCheck] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<AppUpdateStatus>({
    state: 'idle',
  });

  useEffect(() => {
    if (!electronApi) return;

    const unsubscribe = electronApi.onUpdateStatus(setUpdateStatus);
    electronApi
      .getUpdateStatus()
      .then(setUpdateStatus)
      .catch(() => undefined);
    electronApi.checkForUpdates().catch(() => undefined);

    const checkManually = () => {
      setForceClose(false);
      setManualCheck(true);
      electronApi.checkForUpdates().catch(() => undefined);
    };
    window.addEventListener(CHECK_FOR_UPDATES_EVENT, checkManually);

    return () => {
      unsubscribe();
      window.removeEventListener(CHECK_FOR_UPDATES_EVENT, checkManually);
    };
  }, [electronApi]);

  const displayedVersion =
    'version' in updateStatus ? updateStatus.version : newVersion;

  const closeModal = () => {
    if (displayedVersion) {
      localStorage.setItem('lastVersionFound', displayedVersion);
    }
    setManualCheck(false);
    setForceClose(true);
  };

  let isVersionNew = false;
  try {
    if (displayedVersion) {
      isVersionNew = semver.gt(
        displayedVersion,
        localStorage.getItem('lastVersionFound') || 'v0.0.0'
      );
    }
  } catch {
    error('failed to parse new version');
  }

  const isElectronUpdateOpen =
    electron.isElectron &&
    (manualCheck ||
      updateStatus.state === 'checking' ||
      updateStatus.state === 'available' ||
      updateStatus.state === 'downloading' ||
      updateStatus.state === 'downloaded' ||
      updateStatus.state === 'installing' ||
      updateStatus.state === 'error');
  const isWebUpdateOpen = !electron.isElectron && !!newVersion && isVersionNew;

  const title = useMemo(() => {
    switch (updateStatus.state) {
      case 'checking':
        return 'Checking for updates';
      case 'available':
      case 'downloading':
        return 'Updating Raptor VR GUI';
      case 'downloaded':
        return 'Update downloaded';
      case 'installing':
        return 'Installing Raptor VR GUI';
      case 'not-available':
        return 'Raptor VR GUI is up to date';
      case 'error':
        return 'Automatic update needs attention';
      default:
        return l10n.getString('version_update-title', {
          version: displayedVersion,
        });
    }
  }, [displayedVersion, l10n, updateStatus.state]);

  const description = useMemo(() => {
    switch (updateStatus.state) {
      case 'checking':
        return 'Checking for the newest official RaptorVR app...';
      case 'available':
        return 'A newer version was found. The download is starting automatically.';
      case 'downloading':
        return `Downloading update... ${Math.round(updateStatus.percent)}% (${formatBytes(updateStatus.transferred)} of ${formatBytes(updateStatus.total)})`;
      case 'downloaded':
        return 'The update is ready. Raptor VR GUI will restart and install it automatically.';
      case 'installing':
        return 'Saving your settings and restarting to install the update. Windows may ask for administrator approval.';
      case 'not-available':
        return `You already have the newest Raptor VR GUI release (${updateStatus.version}).`;
      case 'unsupported':
      case 'error':
        return updateStatus.message;
      default:
        return l10n.getString('version_update-description');
    }
  }, [l10n, updateStatus]);

  const runPrimaryAction = async () => {
    if (!electron.isElectron) {
      await openUrl(`https://github.com/${GH_REPO}/releases/latest`);
      closeModal();
      return;
    }

    if (appUpdateAction(updateStatus).busy) {
      return;
    }
    if (updateStatus.state === 'downloaded') {
      await electron.api.installUpdate();
      return;
    }
    if (updateStatus.state === 'error' || updateStatus.state === 'idle') {
      await electron.api.checkForUpdates();
      return;
    }
    if (updateStatus.state === 'unsupported') {
      await openUrl(`https://github.com/${GH_REPO}/releases/latest`);
      return;
    }
    closeModal();
  };

  const action = appUpdateAction(updateStatus);
  const primaryLabel = electron.isElectron
    ? action.label
    : l10n.getString('version_update-update');
  const isBusy = electron.isElectron && action.busy;

  return (
    <BaseModal
      isOpen={!forceClose && (isElectronUpdateOpen || isWebUpdateOpen)}
      onRequestClose={closeModal}
    >
      <div className="flex flex-col gap-3">
        <>
          <div className="flex flex-col items-center gap-3 fill-accent-background-20">
            <div className="flex flex-col items-center gap-2">
              <Typography variant="main-title">{title}</Typography>
              <Typography variant="standard">{description}</Typography>
            </div>
          </div>

          {updateStatus.state === 'downloading' && (
            <div className="flex flex-col gap-2">
              <div
                className="h-2 overflow-hidden rounded-full bg-background-60"
                role="progressbar"
                aria-label="Update download progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(updateStatus.percent)}
              >
                <div
                  className="h-full bg-accent-background-20 transition-[width] duration-300"
                  style={{ width: `${updateStatus.percent}%` }}
                />
              </div>
              <Typography variant="standard">
                Your tracker setup, calibration, and app settings stay saved.
              </Typography>
            </div>
          )}

          <Button
            variant="primary"
            disabled={isBusy}
            onClick={() => runPrimaryAction().catch(() => undefined)}
          >
            {primaryLabel}
          </Button>
          <Button variant="tertiary" onClick={closeModal}>
            {l10n.getString('version_update-close')}
          </Button>
        </>
      </div>
    </BaseModal>
  );
}

/**
 * A GitHub release.
 */
export interface Release {
  url: string;
  html_url: string;
  assets_url: string;
  upload_url: string;
  tarball_url: string | null;
  zipball_url: string | null;
  id: number;
  node_id: string;
  /**
   * The name of the tag.
   */
  tag_name: string;
  /**
   * Specifies the commitish value that determines where the Git tag is created from.
   */
  target_commitish: string;
  name: string | null;
  body?: string | null;
  /**
   * true to create a draft (unpublished) release, false to create a published one.
   */
  draft: boolean;
  /**
   * Whether to identify the release as a prerelease or a full release.
   */
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  author: SimpleUser;
  assets: ReleaseAsset[];
  body_html?: string;
  body_text?: string;
  mentions_count?: number;
  /**
   * The URL of the release discussion.
   */
  discussion_url?: string;
  reactions?: ReactionRollup;
  [k: string]: unknown;
}
/**
 * A GitHub user.
 */
export interface SimpleUser {
  name?: string | null;
  email?: string | null;
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  starred_at?: string;
  [k: string]: unknown;
}
/**
 * Data related to a release.
 */
export interface ReleaseAsset {
  url: string;
  browser_download_url: string;
  id: number;
  node_id: string;
  /**
   * The file name of the asset.
   */
  name: string;
  label: string | null;
  /**
   * State of the release asset.
   */
  state: 'uploaded' | 'open';
  content_type: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  uploader: null | SimpleUser1;
  [k: string]: unknown;
}
/**
 * A GitHub user.
 */
export interface SimpleUser1 {
  name?: string | null;
  email?: string | null;
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  starred_at?: string;
  [k: string]: unknown;
}
export interface ReactionRollup {
  url: string;
  total_count: number;
  '+1': number;
  '-1': number;
  laugh: number;
  confused: number;
  heart: number;
  hooray: number;
  eyes: number;
  rocket: number;
  [k: string]: unknown;
}
