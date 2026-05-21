from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT / "assets/runs/battle-refresh"
OUT_BACKDROPS = ROOT / "assets/backdrops"
OUT_ENEMIES = ROOT / "assets/enemies/tutorial"
MANIFEST_PATH = ROOT / "data/asset_manifest.json"
KEY = (255, 0, 255)


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


def fit_padded(image: Image.Image, width: int, height: int, scale: float = 0.88) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError("source image became fully transparent")
    trimmed = image.crop(bbox)
    trimmed.thumbnail((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = (width - trimmed.width) // 2
    y = height - trimmed.height - max(4, height // 14)
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


def save_enemy(source: Path, out_path: Path, width: int, height: int) -> int:
    processed = fit_padded(key_to_alpha(Image.open(source)), width, height)
    processed.save(out_path)
    return edge_alpha_count(processed)


def main() -> None:
    OUT_BACKDROPS.mkdir(parents=True, exist_ok=True)
    OUT_ENEMIES.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    images = manifest.setdefault("images", {})

    backdrop_source = RUN_ROOT / "tutorial-backdrop/source.png"
    backdrop_out = OUT_BACKDROPS / "tutorial-battle.png"
    backdrop = Image.open(backdrop_source).convert("RGB")
    backdrop = ImageOps.fit(backdrop, (960, 365), method=Image.Resampling.LANCZOS, centering=(0.5, 0.58))
    backdrop.save(backdrop_out)
    images["backdrop.tutorial.generated"] = {
        "kind": "standalone",
        "path": str(backdrop_out.relative_to(ROOT)).replace("\\", "/"),
        "width": 960,
        "height": 365,
        "source_run": str((RUN_ROOT / "tutorial-backdrop").relative_to(ROOT)).replace("\\", "/")
    }

    enemies = [
        ("enemy.slime.standalone", ROOT / "assets/runs/standalone-props/slime-marker/source.png", OUT_ENEMIES / "slime.png", 128, 96),
        ("enemy.thorn.standalone", RUN_ROOT / "thorn-imp/source.png", OUT_ENEMIES / "thorn-imp.png", 128, 128)
    ]
    report = {"ok": True, "assets": []}
    for asset_id, source, out_path, width, height in enemies:
        edge_pixels = save_enemy(source, out_path, width, height)
        if edge_pixels:
            report["ok"] = False
        images[asset_id] = {
            "kind": "standalone",
            "path": str(out_path.relative_to(ROOT)).replace("\\", "/"),
            "width": width,
            "height": height,
            "source_run": str(source.parent.relative_to(ROOT)).replace("\\", "/"),
            "edge_alpha_pixels": edge_pixels
        }
        report["assets"].append({"id": asset_id, "path": images[asset_id]["path"], "edge_alpha_pixels": edge_pixels})

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    report_path = RUN_ROOT / "validation.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Battle refresh processing ok={report['ok']}")
    if not report["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
