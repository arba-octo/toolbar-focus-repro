import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {Parcel} from '@parcel/core';
import {prepareSources, root, verifySource, versions} from './prepare.mjs';

const dist = path.join(root, 'dist');
const toolbarPath = 'packages/react-aria/src/toolbar/useToolbar.ts';
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const dependencyDirectories = new Set();
process.env.PARCEL_WORKERS ||= '2';

function writeJson(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function rememberDependency(file) {
  if (!file.includes(`${path.sep}node_modules${path.sep}`)) return;
  let directory = path.dirname(file);
  while (directory !== path.dirname(directory)) {
    const manifest = path.join(directory, 'package.json');
    if (existsSync(manifest) && JSON.parse(readFileSync(manifest, 'utf8')).name) {
      dependencyDirectories.add(directory);
      return;
    }
    directory = path.dirname(directory);
  }
}

function verifySourceMap(directory, toolbarCode) {
  let matches = 0;
  for (const name of readdirSync(directory).filter(name => name.endsWith('.map'))) {
    const map = JSON.parse(readFileSync(path.join(directory, name), 'utf8'));
    map.sources.forEach((source, index) => {
      if (source.replaceAll('\\', '/').endsWith(toolbarPath)) {
        matches++;
        if (map.sourcesContent[index] !== toolbarCode) {
          throw new Error(`Source map does not match the pinned Toolbar source: ${name}`);
        }
      }
    });
  }
  if (!matches) throw new Error('Toolbar source is missing from the generated source maps');
}

prepareSources();
mkdirSync(dist, {recursive: true});

for (const [variant, source] of Object.entries(versions)) {
  const sourceRoot = verifySource(variant);
  const entry = path.join(root, '.build', variant);
  const output = path.join(dist, variant);
  mkdirSync(entry, {recursive: true});
  for (const file of ['demo.tsx', 'styles.css']) {
    copyFileSync(path.join(root, 'src', file), path.join(entry, file));
  }
  copyFileSync(path.join(root, 'src/demo.html'), path.join(entry, 'index.html'));

  const toolbarCode = readFileSync(path.join(sourceRoot, toolbarPath), 'utf8');
  const provenance = {
    variant,
    ...source,
    commitUrl: `https://github.com/${source.repository}/commit/${source.commit}`,
    sourceUrl: `https://github.com/${source.repository}/blob/${source.commit}/${toolbarPath}`,
    toolbarSha256: createHash('sha256').update(toolbarCode).digest('hex'),
    dependencies: pkg.dependencies,
    parcel: pkg.devDependencies['@parcel/core']
  };
  writeJson(path.join(entry, 'provenance.json'), provenance);

  const {bundleGraph, buildTime} = await new Parcel({
    entries: path.join(entry, 'index.html'),
    config: path.join(root, '.parcelrc'),
    projectRoot: root,
    mode: 'production',
    env: {NODE_ENV: 'development'},
    shouldAutoInstall: false,
    shouldDisableCache: true,
    cacheDir: path.join(root, '.parcel-cache', variant),
    defaultTargetOptions: {
      distDir: output, publicUrl: './', shouldOptimize: false,
      shouldScopeHoist: false, sourceMaps: true
    }
  }).run();

  let foundToolbar = false;
  bundleGraph.traverse(({type, value}) => {
    if (type !== 'asset') return;
    const file = path.resolve(value.filePath);
    if (file === path.join(sourceRoot, toolbarPath)) foundToolbar = true;
    const relative = path.relative(path.join(root, '.sources'), file);
    if (!relative.startsWith('..') && !relative.startsWith(variant + path.sep)) {
      throw new Error(`Mixed source versions in ${variant}: ${file}`);
    }
    rememberDependency(file);
  });
  if (!foundToolbar) throw new Error(`${variant}: the real useToolbar.ts was not bundled`);
  verifySourceMap(output, toolbarCode);
  writeJson(path.join(output, 'provenance.json'), provenance);
  console.log(`Built ${variant} in ${buildTime}ms; Toolbar SHA256 ${provenance.toolbarSha256}`);
}

copyFileSync(path.join(root, 'index.html'), path.join(dist, 'index.html'));
copyFileSync(path.join(root, 'src/styles.css'), path.join(dist, 'styles.css'));
copyFileSync(path.join(root, 'versions.json'), path.join(dist, 'versions.json'));

const licenseRoot = path.join(dist, 'licenses');
mkdirSync(licenseRoot, {recursive: true});
const licenseLinks = [];
function copyNotices(directory, label, prefix) {
  const names = readdirSync(directory).filter(name => /^(licen[sc]e|notice|copying)(\.|$)/i.test(name));
  // Some marker packages ship only their license declaration in package.json.
  if (!names.length && existsSync(path.join(directory, 'package.json'))) names.push('package.json');
  if (!names.length) throw new Error(`No license information found for ${label}`);
  for (const name of names) {
    const target = `${prefix}-${name}.txt`;
    copyFileSync(path.join(directory, name), path.join(licenseRoot, target));
    licenseLinks.push(`<li><a href="./${encodeURIComponent(target)}">${label}: ${name}</a></li>`);
  }
}
for (const variant of Object.keys(versions)) {
  copyNotices(path.join(root, '.sources', variant), `React Spectrum (${variant})`, `react-spectrum-${variant}`);
}
for (const directory of [...dependencyDirectories].sort()) {
  const dependency = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'));
  copyNotices(directory, `${dependency.name}@${dependency.version}`, dependency.name.replaceAll('/', '-'));
}
writeFileSync(path.join(licenseRoot, 'index.html'), `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Licenses | Toolbar focus</title><link rel="stylesheet" href="../styles.css">
<main><h1>Source licenses & notices</h1><p>Original files from the pinned source checkouts and installed packages. If a package ships no license file, its package.json preserves the declared license.</p><ul>${licenseLinks.join('\n')}</ul><a href="../">All four examples</a></main></html>\n`);
console.log('Ready: dist/index.html and four examples. Source maps verified for both commits.');
