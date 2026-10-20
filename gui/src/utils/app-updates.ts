import type { AppUpdateStatus } from '../../electron/preload/interface';

export function appUpdateAction(status: AppUpdateStatus) {
  switch (status.state) {
    case 'checking':
      return { label: 'Checking...', busy: true };
    case 'available':
      return { label: 'Starting download...', busy: true };
    case 'downloading':
      return { label: 'Downloading...', busy: true };
    case 'downloaded':
      return { label: 'Restart now', busy: false };
    case 'installing':
      return { label: 'Installing...', busy: true };
    case 'error':
      return { label: 'Try again', busy: false };
    case 'unsupported':
      return { label: 'Open download page', busy: false };
    case 'idle':
      return { label: 'Check for updates', busy: false };
    case 'not-available':
      return { label: 'Done', busy: false };
  }
}
