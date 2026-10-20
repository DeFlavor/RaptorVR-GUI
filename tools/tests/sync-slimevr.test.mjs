import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { nextRaptorVersion, mergeRelease } from '../sync-slimevr.mjs';

test('RaptorVR versions always advance beyond both the current app and upstream', () => {
  assert.equal(nextRaptorVersion('20.1.4', '21.1.0'), '21.1.1');
  assert.equal(nextRaptorVersion('21.1.1', '21.1.1'), '21.1.2');
  assert.equal(nextRaptorVersion('21.1.7', '21.1.2'), '21.1.8');
  assert.throws(() => nextRaptorVersion('21.1.1', '22.0.0-rc.1'));
});

function repository(t) {
  const directory = mkdtempSync(join(tmpdir(), 'raptor-sync-test-'));
  const git = (...args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-b', 'main');
  git('config', 'core.autocrlf', 'false');
  git('config', 'user.name', 'Updater test');
  git('config', 'user.email', 'test@example.invalid');
  const save = (file, value) => writeFileSync(join(directory, file), value);
  const commit = () => { git('add', '.'); git('commit', '-m', 'fixture'); };
  save('tracking.txt', 'tracking v1\n');
  save('ui.txt', 'original UI\n');
  commit();
  git('branch', 'upstream');
  t.after(() => {
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + '\\raptor-sync-test-') || resolve(directory).startsWith(resolve(tmpdir()) + '/raptor-sync-test-'));
    rmSync(directory, { recursive: true, force: true });
  });
  return { directory, git, save, commit };
}

test('an upstream mechanics update preserves the customized RaptorVR UI', (t) => {
  const r = repository(t);
  r.git('switch', 'upstream'); r.save('tracking.txt', 'tracking v2\n'); r.commit();
  r.git('switch', 'main'); r.save('ui.txt', 'RaptorVR interface\n'); r.commit();
  mergeRelease(r.directory, 'upstream');
  assert.equal(readFileSync(join(r.directory, 'tracking.txt'), 'utf8'), 'tracking v2\n');
  assert.equal(readFileSync(join(r.directory, 'ui.txt'), 'utf8'), 'RaptorVR interface\n');
});

test('a conflicting upstream update is aborted without changing the working app', (t) => {
  const r = repository(t);
  r.git('switch', 'upstream'); r.save('ui.txt', 'upstream replacement\n'); r.commit();
  r.git('switch', 'main'); r.save('ui.txt', 'RaptorVR interface\n'); r.commit();
  const before = r.git('rev-parse', 'HEAD');
  assert.throws(() => mergeRelease(r.directory, 'upstream'), /Integration stopped/);
  assert.equal(r.git('rev-parse', 'HEAD'), before);
  assert.equal(r.git('status', '--porcelain'), '');
  assert.equal(readFileSync(join(r.directory, 'ui.txt'), 'utf8'), 'RaptorVR interface\n');
});
