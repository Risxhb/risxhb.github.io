from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data/asset_manifest.json"
OUT_ROOT = ROOT / "assets/tiles/tutorial"
RUN_ROOT = ROOT / "assets/runs/tutorial-grass-variants"


def shift_colors(image: Image.Image, dr: int, dg: int, db: int) -> Image.Image:
    out = image.convert("RGBA").copy()
    pixels = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = pixels[x, y]
            pixels[x, y] = (max(0, min(255, r + dr)), max(0, min(255, g + dg)), max(0, min(255, b + db)), a)
    return out


def add_pixels(image: Image.Image, marks: list[tuple[int, int, tuple[int, int, int, int]]]) -> Image.Image:
    out = image.copy()
    draw = ImageDraw.Draw(out)
    for x, y, color in marks:
        draw.point((x, y), fill=color)
        if x + 1 < out.width:
            draw.point((x + 1, y), fill=color)
    return out


def grass_marks(seed: int, color: tuple[int, int, int, int], count: int) -> list[tuple[int, int, tuple[int, int, int, int]]]:
    marks = []
    value = seed
    for _ in range(count):
        value = (value * 1103515245 + 12345) & 0x7fffffff
        x = 2 + value % 28
        value = (value * 1103515245 + 12345) & 0x7fffffff
        y = 2 + value % 28
        marks.append((x, y, color))
    return marks


def build_wind_sheet(base: Image.Image) -> Image.Image:
    frames = []
    for frame in range(4):
        tile = shift_colors(base, 0, frame % 2, 0)
        draw = ImageDraw.Draw(tile)
        offset = [0, 1, 0, -1][frame]
        for x, y, color in grass_marks(300 + frame, (188, 224, 92, 255), 8):
            draw.line((x, y, min(31, x + 2 + offset), max(0, y - 1)), fill=color)
            draw.point((x, y + 1), fill=(68, 132, 43, 255))
        frames.append(tile)
    sheet = Image.new("RGBA", (32 * len(frames), 32), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        sheet.alpha_composite(frame, (i * 32, 0))
    return sheet


def main() -> None:
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    RUN_ROOT.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    tutorial = manifest["atlases"]["tutorial"]
    region = tutorial["regions"]["tile.tutorial.grass"]
    atlas = Image.open(ROOT / tutorial["path"]).convert("RGBA")
    base = atlas.crop((region["x"], region["y"], region["x"] + region["w"], region["y"] + region["h"]))
    base.save(RUN_ROOT / "source-grass.png")

    variants = {
        "tile.tutorial.grass.soft": shift_colors(base, 3, 8, -2),
        "tile.tutorial.grass.deep": shift_colors(base, -5, -3, 2),
        "tile.tutorial.grass.clover": add_pixels(base, grass_marks(11, (170, 220, 83, 255), 12)),
        "tile.tutorial.grass.sprout": add_pixels(base, grass_marks(77, (224, 218, 96, 255), 10)),
    }
    images = manifest.setdefault("images", {})
    for asset_id, image in variants.items():
        name = asset_id.split(".")[-1]
        out_path = OUT_ROOT / f"grass-{name}.png"
        image.save(out_path)
        images[asset_id] = {
            "kind": "tile",
            "path": str(out_path.relative_to(ROOT)).replace("\\", "/"),
            "width": 32,
            "height": 32,
            "source_run": str(RUN_ROOT.relative_to(ROOT)).replace("\\", "/"),
            "derived_from": "tile.tutorial.grass"
        }

    wind = build_wind_sheet(base)
    wind_path = OUT_ROOT / "grass-wind.png"
    wind.save(wind_path)
    images["tile.tutorial.grass.wind"] = {
        "kind": "spritesheet",
        "path": str(wind_path.relative_to(ROOT)).replace("\\", "/"),
        "width": 128,
        "height": 32,
        "source_run": str(RUN_ROOT.relative_to(ROOT)).replace("\\", "/"),
        "derived_from": "tile.tutorial.grass",
        "animation": {
            "name": "wind",
            "frame_width": 32,
            "frame_height": 32,
            "frames": 4,
            "fps": 3
        }
    }

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("Built tutorial grass variants")


if __name__ == "__main__":
    main()
