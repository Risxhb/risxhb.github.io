from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT / "assets" / "runs" / "campsite-props"
OUT_ROOT = ROOT / "assets" / "props" / "tutorial"
MANIFEST_PATH = ROOT / "data" / "asset_manifest.json"

PROPS = {
    "tent": {"asset": "prop.tutorial.tent", "file": "tent.png", "size": (128, 128), "cell": (0, 0)},
    "tent-interior": {"asset": "prop.tutorial.tent.interior", "file": "tent-interior.png", "size": (128, 96), "cell": (1, 0)},
    "bedroll": {"asset": "prop.tutorial.bedroll", "file": "bedroll.png", "size": (80, 64), "cell": (0, 1)},
    "supplies": {"asset": "prop.tutorial.supplies", "file": "supplies.png", "size": (80, 80), "cell": (1, 1)},
}


def alpha_bbox(image: Image.Image):
    return image.getchannel("A").getbbox()


def key_magenta(source: Image.Image) -> Image.Image:
    image = source.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if r > 175 and b > 175 and g < 100:
                pixels[x, y] = (r, g, b, 0)
            elif r > 135 and b > 135 and g < 135:
                pixels[x, y] = (r, g, b, min(a, 36))
    return image


def edge_alpha_pixels(image: Image.Image) -> int:
    alpha = image.getchannel("A")
    w, h = image.size
    total = 0
    for x in range(w):
        total += alpha.getpixel((x, 0)) > 0
        total += alpha.getpixel((x, h - 1)) > 0
    for y in range(h):
        total += alpha.getpixel((0, y)) > 0
        total += alpha.getpixel((w - 1, y)) > 0
    return int(total)


def normalize(cell: Image.Image, width: int, height: int) -> Image.Image:
    frame = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    bbox = alpha_bbox(cell)
    if not bbox:
        return frame
    subject = cell.crop(bbox)
    scale = min((width - 8) / subject.width, (height - 6) / subject.height)
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    x = (width - resized.width) // 2
    y = height - resized.height - 3
    frame.alpha_composite(resized, (x, y))
    return frame


def main() -> None:
    source = key_magenta(Image.open(RUN_ROOT / "source.png"))
    cell_w = source.width / 2
    cell_h = source.height / 2
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf8"))
    images = manifest.setdefault("images", {})
    report = {"source": "assets/runs/campsite-props/source.png", "props": []}
    for prop_id, spec in PROPS.items():
        col, row = spec["cell"]
        cell = source.crop((round(col * cell_w), round(row * cell_h), round((col + 1) * cell_w), round((row + 1) * cell_h)))
        out = normalize(cell, *spec["size"])
        out_path = OUT_ROOT / spec["file"]
        out.save(out_path)
        edge = edge_alpha_pixels(out)
        if edge:
            raise SystemExit(f"{spec['asset']} edge_alpha_pixels={edge}")
        images[spec["asset"]] = {
            "kind": "standalone",
            "path": out_path.relative_to(ROOT).as_posix(),
            "width": spec["size"][0],
            "height": spec["size"][1],
            "source_run": "assets/runs/campsite-props",
            "edge_alpha_pixels": 0,
        }
        report["props"].append({"asset": spec["asset"], "output": out_path.relative_to(ROOT).as_posix(), "edge_alpha_pixels": 0})
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf8")
    (RUN_ROOT / "validation.json").write_text(json.dumps(report, indent=2), encoding="utf8")
    print(json.dumps({"ok": True, "props": [item["asset"] for item in report["props"]]}, indent=2))


if __name__ == "__main__":
    main()
