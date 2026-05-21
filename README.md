# Eve: Moonroot Hollow

Eve is a browser-hosted, canvas-native RPG prototype. The public homepage runs
from the GitHub Pages root and the playable game is published at `/eve/`.

## Run Locally

From the repository root:

```powershell
python -m http.server 8787 --directory eve
```

Then open:

```text
http://127.0.0.1:8787/index.html
```

## Validate

```powershell
node eve/tools/validate-data.mjs
node eve/tools/smoke-canvas.mjs
```

`validate-data.mjs` checks manifest paths, data references, map exits, scripts,
quests, actors, shops, combat assets, animation metadata, and dungeon data.

`smoke-canvas.mjs` starts a local static server, launches a headless browser, and
captures a canvas smoke screenshot.

## GitHub Pages

The repo root contains a landing page:

```text
index.html
landing.css
.nojekyll
```

The playable game stays at:

```text
eve/index.html
```

To create a clean Pages-ready folder:

```powershell
.\scripts\build_pages_site.ps1 -Output dist-pages -GameFolderName eve
```

The build script copies only runtime game files and manifest-referenced assets
from `eve/`.

## Repository Hygiene

Generated source runs, temporary output, QA screenshots, and unused assets are
kept out of the public repo. Runtime assets are manifest-driven through
`eve/data/asset_manifest.json`.

Ignored local/output paths include:

- `.tmp/`
- `dist-pages/`
- `eve/qa-*.png`
- `eve/eve/`
- `eve/assets/runs/`
- `__pycache__/`
- `*.pyc`

## Development Utilities

The root `scripts/` and `templates/` folders contain a reusable sprite production
scaffold. They are optional development tools and are not required to play the
game.
