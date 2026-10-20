const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { EventEmitter } = require('node:events');
const vm = require('node:vm');
const ts = require('typescript');

function compile(file) {
  return ts.transpileModule(readFileSync(join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
}

function fixture(packaged = true) {
  const updater = new EventEmitter();
  const app = new EventEmitter();
  app.isPackaged = packaged;
  app.getVersion = () => '20.1.4';
  const handlers = new Map();
  const statuses = [];
  const timeouts = [];
  const intervals = [];
  let checks = 0;
  let installs = 0;
  let saves = 0;
  let fail = false;
  updater.checkForUpdates = async () => {
    checks++;
    updater.emit('checking-for-update');
    if (fail) throw new Error('Cannot reach https://example.test/private-path');
    await Promise.resolve();
    updater.emit('update-not-available', { version: '20.1.4' });
  };
  updater.quitAndInstall = (silent, reopen) => {
    assert.equal(silent, true);
    assert.equal(reopen, true);
    assert.equal(saves, 1, 'Save tracker settings before replacing the app');
    installs++;
  };
  const exports = {};
  vm.runInNewContext(compile('electron/main/updater.ts'), {
    exports,
    require: (name) => {
      if (name === 'electron') return { app };
      if (name === 'electron-updater') return { autoUpdater: updater };
      if (name === '../shared') return { IPC_CHANNELS: {
        UPDATER_STATUS: 'status', UPDATER_CHECK: 'check', UPDATER_DOWNLOAD: 'download',
        UPDATER_INSTALL: 'install', UPDATER_GET_STATUS: 'get',
      } };
      if (name === './utils') return { handleIpc: (key, handler) => handlers.set(key, handler) };
      if (name === './logger') return { logger: { error() {} } };
      throw new Error(`Unexpected runtime dependency: ${name}`);
    },
    setTimeout: (callback, ms) => { timeouts.push({ callback, ms }); },
    setInterval: (callback, ms) => {
      const timer = { callback, ms, unref() {} };
      intervals.push(timer);
      return timer;
    },
    clearInterval() {},
  });
  exports.initializeAppUpdater(() => ({ webContents: {
    isDestroyed: () => false, send: (_channel, value) => statuses.push(value),
  } }), async () => { saves++; });
  return { updater, app, handlers, statuses, timeouts, intervals,
    checks: () => checks, installs: () => installs, fail: (value) => { fail = value; } };
}

test('the button reports checking separately from downloading', () => {
  const exports = {};
  vm.runInNewContext(compile('src/utils/app-updates.ts'), { exports });
  assert.equal(exports.appUpdateAction({ state: 'checking' }).label, 'Checking...');
  assert.equal(exports.appUpdateAction({ state: 'downloading' }).label, 'Downloading...');
  assert.equal(exports.appUpdateAction({ state: 'installing' }).busy, true);
  assert.equal(exports.appUpdateAction({ state: 'error' }).label, 'Try again');
});

test('repeated clicks share one update check and return an up-to-date status', async () => {
  const f = fixture();
  await Promise.all([f.handlers.get('check')(), f.handlers.get('check')()]);
  assert.equal(f.checks(), 1);
  assert.equal(f.statuses.at(-1).state, 'not-available');
  assert.equal(f.updater.autoDownload, true);
  assert.equal(f.updater.autoInstallOnAppQuit, true);
  assert.equal(f.updater.autoRunAppAfterInstall, true);
});

test('a network failure is visible and a later retry succeeds', async () => {
  const f = fixture();
  f.fail(true);
  await Promise.all([f.handlers.get('check')(), f.handlers.get('check')()]);
  assert.equal(f.statuses.at(-1).state, 'error');
  assert.ok(!f.statuses.at(-1).message.includes('https://'));
  f.fail(false);
  await f.handlers.get('check')();
  assert.equal(f.statuses.at(-1).state, 'not-available');
  assert.equal(f.checks(), 2);
});

test('clicking during a download leaves it running and does not start a second one', async () => {
  const f = fixture();
  f.updater.emit('update-available', { version: '21.1.1' });
  f.updater.emit('download-progress', { percent: 35, transferred: 35, total: 100, bytesPerSecond: 10 });
  await f.handlers.get('check')();
  await f.handlers.get('download')();
  assert.equal(f.checks(), 0);
  assert.equal(f.statuses.at(-1).state, 'downloading');
  assert.equal(f.statuses.at(-1).percent, 35);
});

test('a finished download saves settings, installs once, and requests reopening', async () => {
  const f = fixture();
  f.updater.emit('update-downloaded', { version: '21.1.1' });
  assert.equal(f.timeouts[0].ms, 1500);
  f.timeouts[0].callback();
  await f.handlers.get('install')();
  assert.equal(f.statuses.at(-1).state, 'installing');
  assert.equal(f.statuses.at(-1).version, '21.1.1');
  assert.equal(f.installs(), 1);
});

test('the running app checks periodically; development builds cannot install updates', async () => {
  const f = fixture();
  assert.equal(f.intervals[0].ms, 60 * 60 * 1000);
  f.intervals[0].callback();
  await Promise.resolve();
  assert.equal(f.checks(), 1);
  const dev = fixture(false);
  await dev.handlers.get('check')();
  await dev.handlers.get('install')();
  assert.equal(dev.statuses.at(-1).state, 'unsupported');
  assert.equal(dev.installs(), 0);
});
