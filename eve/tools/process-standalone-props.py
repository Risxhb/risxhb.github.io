from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT / "assets/runs/standalone-props"
OUT_ROOT = ROOT / "assets/props/tutorial"
MANIFEST_PATH = ROOT / "data/asset_manifest.json"
KEY = (255, 0, 255)

TARGETS = {
    "prop.tutorial.tree.standalone": {"slug": "tree", "width": 128, "height": 128},
    "prop.tutorial.flowers.standalone": {"slug": "flowers", "width": 64, "height": 64},
    "prop.tutorial.waystone.standalone": {"slug": "waystone", "width": 96, "height": 128},
    "prop.tutorial.log.standalone": {"slug": "log", "width": 128, "height": 72},
    "prop.tutorial.campfire.standalone": {"slug": "campfire", "width": 80, "height": 80},
    "prop.tutorial.slime.standalone": {"slug": "slime-marker", "width": 72, "height": 56},
}


def key_to_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            close_to_key = abs(r - KEY[0]) + abs(g - KEY[1]) + abs(b - KEY[2]) <= 120
            magenta_fringe = r > 175 and b > 150 and g < 95
            if close_to_key or magenta_fringe:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def fit_padded(image: Image.Image, width: int, height: int) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError("source image became fully transparent")
    trimmed = image.crop(bbox)
    max_w = int(width * 0.86)
    max_h = int(height * 0.86)
    trimmed.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = (width - trimmed.width) // 2
    y = height - trimmed.height - max(4, height // 16)
    out.alpha_composite(trimmed, (x, y))
    return out


def edge_alpha_count(image: Image.Image) -> int:
    alpha = image.getchannel("A")
    width, height = image.size
    count = 0
    for x in range(width):
        count += alpha.getpixel((x, 0)) > 0
        count += alpha.getpixel((x, height - 1)) > 0
    for y in range(height):
        count += alpha.getpixel((0, y)) > 0
        count += alpha.getpixel((width - 1, y)) > 0
    return int(count)


def main() -> None:
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    images = manifest.setdefault("images", {})
    report = {"ok": True, "assets": []}
    for asset_id, spec in TARGETS.items():
      slug = spec["slug"]
      source = RUN_ROOT / slug / "source.png"
      if not source.exists():
          raise FileNotFoundError(f"Missing source for {asset_id}: {source}")
      processed = fit_padded(key_to_alpha(Image.open(source)), spec["width"], spec["height"])
      edge_pixels = edge_alpha_count(processed)
      if edge_pixels:
          report["ok"] = False
      out_path = OUT_ROOT / f"{slug}.png"
      processed.save(out_path)
      images[asset_id] = {
          "kind": "standalone",
          "path": str(out_path.relative_to(ROOT)).replace("\\", "/"),
          "width": spec["width"],
          "height": spec["height"],
          "source_run": str((RUN_ROOT / slug).relative_to(ROOT)).replace("\\", "/"),
          "edge_alpha_pixels": edge_pixels
      }
      report["assets"].append({"id": asset_id, "path": images[asset_id]["path"], "edge_alpha_pixels": edge_pixels})
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    report_path = RUN_ROOT / "validation.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Standalone prop processing ok={report['ok']}")
    if not report["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
