from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data/asset_manifest.json"
OUT_PATH = ROOT / "assets/ui/modal-panel.png"


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    main_atlas = manifest["atlases"]["main"]
    region = main_atlas["regions"]["ui.dialogue"]
    atlas = Image.open(ROOT / main_atlas["path"]).convert("RGBA")
    panel = atlas.crop((region["x"], region["y"], region["x"] + region["w"], region["y"] + region["h"]))

    # Remove the dialogue-only continue arrow while preserving the generated frame.
    patch = panel.crop((96, 56, 184, 94)).resize((88, 38), Image.Resampling.BICUBIC)
    panel.alpha_composite(patch, (96, 94))

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    panel.save(OUT_PATH)

    images = manifest.setdefault("images", {})
    images["ui.modal"] = {
        "kind": "standalone",
        "path": str(OUT_PATH.relative_to(ROOT)).replace("\\", "/"),
        "width": panel.width,
        "height": panel.height,
        "source_run": "assets/runs/main-atlas",
        "derived_from": "ui.dialogue"
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Built {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
