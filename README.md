# Toolbar focus: before & after

[Live demo](https://arba-octo.github.io/toolbar-focus-repro/) · [React Spectrum PR #10938](https://github.com/adobe/react-spectrum/pull/10938) · [Issue #10934](https://github.com/adobe/react-spectrum/issues/10934)

Reproduce Toolbar restoring focus to the previous button when another button is clicked after leaving the toolbar.

| Controls | Before | After |
| --- | --- | --- |
| React Aria Button | [Open](https://arba-octo.github.io/toolbar-focus-repro/before/?controls=rac) | [Open](https://arba-octo.github.io/toolbar-focus-repro/after/?controls=rac) |
| Native HTML buttons | [Open](https://arba-octo.github.io/toolbar-focus-repro/before/?controls=native) | [Open](https://arba-octo.github.io/toolbar-focus-repro/after/?controls=native) |

## Source provenance

The demo imports the real `Toolbar` and `Button` components from React Spectrum source exports. Native examples render ordinary `<button>` elements inside that same Toolbar.

[`versions.json`](./versions.json) pins two complete commits:

- Before: [`adobe/react-spectrum@82959b6a`](https://github.com/adobe/react-spectrum/commit/82959b6a9ac4ea717228636b99fc8fd24736a7f4).
- After: [`arba-octo/react-spectrum@9e2cdab2`](https://github.com/arba-octo/react-spectrum/commit/9e2cdab2be9932af0e2db818eb0e307df5a05668), the PR commit.

[`prepare.mjs`](./scripts/prepare.mjs) fetches these commits with Git and verifies each SHA, remote and clean checkout. [`parcel-resolver.cjs`](./scripts/parcel-resolver.cjs) resolves workspace imports directly to the corresponding checkout. [`build.mjs`](./scripts/build.mjs) builds each version separately, verifies that the real `useToolbar.ts` is bundled, and checks its source-map content against the pinned file. The build fails if these checks do not match.

Both builds share the same dependency lockfile and page code. Each example exposes its commit, source link and Toolbar SHA256 in `provenance.json`. GitHub Actions logs both verified commits. The page only renders the controls and records focus/activation; it does not implement or patch Toolbar behavior.

## Reproduce with a mouse

1. Click **Before**, press **Tab**, **Right Arrow**, then **Tab**. Focus reaches After; Toolbar remembers Second.
2. Click **First**. Before the fix, First activates but focus moves to Second. After the fix, First activates and keeps focus.
3. Click **After**, then **Shift+Tab**. Check restoration to the last focused toolbar button.

This sequence was verified in Chrome 156 for all four examples on 2026-11-08. Both before examples reproduce the focus jump; both after examples keep focus on First. Keyboard restoration works in each example.

## Check with NVDA

1. Reload. Click **Before**, then press **Tab**, **Right Arrow**, **Tab** in focus mode.
2. Switch to browse mode with **NVDA+Space**. Press **Shift+B** three times to read Third, Second, First.
3. Immediately press **Enter**. Check **Last activated**, the final focus outline and the spoken button name.

Complete the sequence without switching apps or moving the mouse between reading and activation. The virtual reading position can differ from DOM focus before activation. Diagnostics do not move focus or use live announcements. For inspection, `window.toolbarCheck.read()` returns the most recent page events.

The original local fixture was manually checked with NVDA 2026.3 and Chrome 156 on Windows on 2026-11-08: browse-mode activation ended on First in both versions and with both button types. An intermediate focus restoration to Second occurred in both versions. This is a limited reproduction, not a claim about every browser or screen reader.

## Run locally

Use Git, Node.js 24.21.0 (see `.node-version`) and npm 11.19.0.

```sh
npm ci
npm run build
npm run preview
```

Open <http://127.0.0.1:4397/toolbar-focus-repro/>. The build fetches only the required source directories into ignored `.sources/` checkouts. It installs no dependencies in the React Spectrum monorepo. The two development React bundles are intentionally unminified for inspection.

## Deployment

GitHub Pages uses GitHub Actions as its publishing source. [The workflow](./.github/workflows/pages.yml) runs on pushes to `main` and can be started manually. It builds from the lockfile and pinned source commits, then publishes `dist/`. Relative asset URLs support the project site path.

The demo is Apache-2.0 licensed. The published [license page](https://arba-octo.github.io/toolbar-focus-repro/licenses/) includes original upstream notices and the available license files or declarations of bundled dependencies.
