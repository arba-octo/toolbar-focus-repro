# Toolbar focus: before & after

[Live demo](https://arba-octo.github.io/toolbar-focus-repro/) · [React Spectrum PR #10938](https://github.com/adobe/react-spectrum/pull/10938) · [Issue #10934](https://github.com/adobe/react-spectrum/issues/10934)

Reproduce Toolbar restoring focus to the previous button when another button is clicked after leaving the toolbar.

| Controls | Before | After |
| --- | --- | --- |
| React Aria Button | [Open](https://arba-octo.github.io/toolbar-focus-repro/before/?controls=rac) | [Open](https://arba-octo.github.io/toolbar-focus-repro/after/?controls=rac) |
| Native HTML buttons | [Open](https://arba-octo.github.io/toolbar-focus-repro/before/?controls=native) | [Open](https://arba-octo.github.io/toolbar-focus-repro/after/?controls=native) |

## Source provenance

Both versions use real React Spectrum sources and the same dependencies. Native examples render HTML `<button>` elements inside the same `Toolbar`.

[`versions.json`](./versions.json) pins two complete commits:

- Before: [`adobe/react-spectrum@82959b6a`](https://github.com/adobe/react-spectrum/commit/82959b6a9ac4ea717228636b99fc8fd24736a7f4).
- After: [`arba-octo/react-spectrum@9e2cdab2`](https://github.com/arba-octo/react-spectrum/commit/9e2cdab2be9932af0e2db818eb0e307df5a05668), the PR commit.

The [build scripts](./scripts/) verify the pinned commits and bundled sources. Each example links to its source and build provenance.

## Reproduce with a mouse

1. Click **Before**, press **Tab**, **Right Arrow**, then **Tab**. Focus reaches After; Toolbar remembers Second.
2. Click **First**. Before the fix, First activates but focus moves to Second. After the fix, First activates and keeps focus.
3. Click **After**, then **Shift+Tab**. Check restoration to the last focused toolbar button.

This sequence was verified in Chrome 156 for all four examples on 2026-11-08. Both before examples reproduce the focus jump; both after examples keep focus on First. Keyboard restoration works in each example.

## Check with NVDA

1. Reload. Click **Before**, then press **Tab**, **Right Arrow**, **Tab** in focus mode.
2. Switch to browse mode with **NVDA+Space**. Press **Shift+B** three times to read Third, Second, First.
3. Immediately press **Enter**. In both versions, expect **Last activated: First**, focus on **First**, and NVDA announcing First.

Complete the sequence without switching apps or moving the mouse between reading and activation. The virtual reading position can differ from DOM focus before activation.

The published HTML-button examples passed this manual check before and after the fix with NVDA 2026.3 and Chrome 156 on Windows on 2026-11-08. The earlier local check passed with both button types; both versions briefly restored focus to Second before ending on First.

## Run locally

Use Git, Node.js 24.21.0 (see `.node-version`) and npm 11.19.0.

```sh
npm ci
npm run build
npm run preview
```

Open <http://127.0.0.1:4397/toolbar-focus-repro/>.

## Deployment

GitHub Pages deploys automatically on pushes to `main` through [this workflow](./.github/workflows/pages.yml).

The demo is Apache-2.0 licensed. The published [license page](https://arba-octo.github.io/toolbar-focus-repro/licenses/) includes original upstream notices and the available license files or declarations of bundled dependencies.
