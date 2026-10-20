import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function nextRaptorVersion(current, upstream) {
  const parse = (value) => {
    if (!/^\d+\.\d+\.\d+$/.test(value)) throw new Error(`Invalid stable version: ${value}`);
    return value.split('.').map(Number);
  };
  const a = parse(current);
  const b = parse(upstream);
  const comparison = a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  const next = comparison >= 0 ? a : b;
  next[2] += 1;
  return next.join('.');
}

function git(directory, ...args) {
  return execFileSync('git', args, {
    cwd: directory,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function mergeRelease(directory, ref) {
  try {
    git(directory, 'merge', '--no-ff', '--no-commit', ref);
  } catch (error) {
    try { git(directory, 'merge', '--abort'); } catch { /* No merge may have started. */ }
    throw new Error('SlimeVR changes conflict with RaptorVR. Integration stopped; the installed app and published release are unchanged.', { cause: error });
  }
}

export async function prepareSync(directory = process.cwd()) {
  if (git(directory, 'status', '--porcelain')) throw new Error('Sync requires a clean checkout.');
  const response = await fetch('https://api.github.com/repos/SlimeVR/SlimeVR-Server/releases/latest', {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'RaptorVR-upstream-sync',
      ...(process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`SlimeVR release lookup failed: HTTP ${response.status}`);
  const release = await response.json();
  if (release.draft || release.prerelease || !/^v\d+\.\d+\.\d+$/.test(release.tag_name)) {
    throw new Error('Expected an official stable SlimeVR release.');
  }
  const markerPath = join(directory, '.github/slimevr-upstream.json');
  const previous = JSON.parse(readFileSync(markerPath, 'utf8'));
  if (previous.tag === release.tag_name) return { changed: 'false', upstream_tag: previous.tag };

  git(directory, 'fetch', '--no-tags', '--recurse-submodules=no',
    'https://github.com/SlimeVR/SlimeVR-Server.git', `refs/tags/${release.tag_name}`);
  const upstreamCommit = git(directory, 'rev-parse', 'FETCH_HEAD^{commit}');
  const base = git(directory, 'rev-parse', 'HEAD');
  const runId = process.env.GITHUB_RUN_ID;
  if (!runId || !/^\d+$/.test(runId)) throw new Error('Run this command through the upstream sync workflow.');
  const branch = `sync/slimevr-${release.tag_name}-${runId}`;
  const previousVersion = JSON.parse(readFileSync(join(directory, 'gui/package.json'), 'utf8')).version;
  git(directory, 'switch', '-c', branch);
  git(directory, 'config', 'user.name', 'RaptorVR upstream sync');
  git(directory, 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
  mergeRelease(directory, upstreamCommit);

  const packagePath = join(directory, 'gui/package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const version = nextRaptorVersion(previousVersion, release.tag_name.slice(1));
  pkg.version = version;
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  writeFileSync(markerPath, JSON.stringify({ repository: 'SlimeVR/SlimeVR-Server',
    version: release.tag_name.slice(1), tag: release.tag_name, commit: upstreamCommit }, null, 2) + '\n');
  git(directory, 'add', '--all');
  git(directory, 'commit', '-m', `Sync SlimeVR ${release.tag_name} for RaptorVR ${version}`);
  const head = git(directory, 'rev-parse', 'HEAD');
  git(directory, 'push', 'origin', `HEAD:refs/heads/${branch}`);
  return { changed: 'true', branch, base_sha: base, head_sha: head,
    version, tag: `v${version}`, upstream_tag: release.tag_name };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const output = await prepareSync();
  console.log(JSON.stringify(output, null, 2));
  if (process.env.GITHUB_OUTPUT) {
    for (const [key, value] of Object.entries(output)) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}
