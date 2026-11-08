const fs = require('node:fs');
const path = require('node:path');
const {Resolver} = require('@parcel/plugin');
const NodeResolver = require('@parcel/node-resolver-core').default;

const root = path.resolve(__dirname, '..');
const workspacePackages = new Set([
  'react-aria', 'react-aria-components', 'react-stately',
  '@internationalized/date', '@internationalized/number',
  '@internationalized/string', '@react-types/shared'
]);
let externalResolver;

module.exports = new Resolver({
  async resolve({specifier, dependency, options}) {
    if (specifier.startsWith('.') || path.isAbsolute(specifier) || specifier.includes(':')) {
      return null;
    }
    const importer = path.relative(root, dependency.resolveFrom || '').replaceAll('\\', '/');
    const variant = importer.match(/^\.(?:build|sources)\/(before|after)\//)?.[1];
    if (!variant) return null;

    const segments = specifier.split('/');
    const name = segments.splice(0, specifier.startsWith('@') ? 2 : 1).join('/');
    if (workspacePackages.has(name)) {
      const directory = path.join(root, '.sources', variant, 'packages', name);
      const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
      const subpath = segments.join('/');
      const source = subpath ? `exports/${subpath}.ts` : pkg.source || pkg.types;
      const filePath = path.join(directory, source);
      if (!fs.existsSync(filePath)) throw new Error(`Missing ${variant} source for ${specifier}: ${filePath}`);
      return {filePath};
    }

    externalResolver ??= new NodeResolver({
      fs: options.inputFS, projectRoot: root, mode: options.mode, packageExports: true
    });
    return externalResolver.resolve({
      filename: specifier,
      parent: path.join(root, 'package.json'),
      specifierType: dependency.specifierType,
      env: dependency.env
    });
  }
});
