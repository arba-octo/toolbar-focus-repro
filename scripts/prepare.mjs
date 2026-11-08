import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const versions = JSON.parse(readFileSync(path.join(root, 'versions.json'), 'utf8'));

const packages = [
  'packages/react-aria',
  'packages/react-aria-components',
  'packages/react-stately',
  'packages/@internationalized/date',
  'packages/@internationalized/number',
  'packages/@internationalized/string',
  'packages/@react-types/shared'
];

function git(directory, ...args) {
  return execFileSync('git', ['-C', directory, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  }).trim();
}

export function verifySource(variant) {
  const directory = path.join(root, '.sources', variant);
  const expected = versions[variant];
  const actual = git(directory, 'rev-parse', 'HEAD');

  if (actual !== expected.commit || git(directory, 'status', '--porcelain')) {
    throw new Error(`${variant}: expected an unchanged checkout of ${expected.commit}`);
  }

  if (
    git(directory, 'remote', 'get-url', 'origin') !==
    `https://github.com/${expected.repository}.git`
  ) {
    throw new Error(`${variant}: unexpected source repository`);
  }

  console.log(`${variant}: ${expected.repository}@${actual} (verified)`);
  return directory;
}

export function prepareSources() {
  for (const [variant, source] of Object.entries(versions)) {
    if (!['before', 'after'].includes(variant) || !/^[a-f0-9]{40}$/.test(source.commit)) {
      throw new Error('Expected before/after entries with full commit SHAs in versions.json');
    }

    const directory = path.join(root, '.sources', variant);

    if (!existsSync(path.join(directory, '.git'))) {
      if (existsSync(directory) && readdirSync(directory).length) {
        throw new Error(`Refusing to overwrite ${directory}`);
      }

      mkdirSync(directory, { recursive: true });
      git(directory, 'init', '--quiet');
      git(directory, 'config', 'core.autocrlf', 'false');
      git(directory, 'remote', 'add', 'origin', `https://github.com/${source.repository}.git`);
      git(directory, 'sparse-checkout', 'set', '--cone', ...packages);
    }

    if (
      git(directory, 'remote', 'get-url', 'origin') !==
        `https://github.com/${source.repository}.git` ||
      git(directory, 'status', '--porcelain')
    ) {
      throw new Error(`${variant}: source checkout has local changes or an unexpected remote`);
    }

    git(directory, 'fetch', '--depth=1', '--filter=blob:none', 'origin', source.commit);
    git(directory, 'checkout', '--detach', source.commit);
    verifySource(variant);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  prepareSources();
}
