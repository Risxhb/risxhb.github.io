# Eve: Moonroot Hollow

A browser-hosted, canvas-native RPG slice. The page only hosts the canvas; the
game draws scenes, menus, combat, and UI inside that canvas from manifest-driven
assets.

## Run

From the repository root:

```powershell
python -m http.server 8787 --directory eve
```

Then open:

```text
http://127.0.0.1:8787/index.html
```

## Controls

- `WASD` or arrow keys: move in 8 directions / menu navigation
- `Enter`, `Space`, or `E`: interact / confirm
- `Escape` or `Backspace`: cancel / field menu
- `I`: inventory
- `P`: party cards
- `Q`: quest log

## Validation

```powershell
node eve/tools/validate-data.mjs
```

## Asset Rule

Runtime visuals are declared in `data/asset_manifest.json` and loaded from
`assets/`. Source-generation folders, QA screenshots, and temporary outputs are
kept outside the public repo.
