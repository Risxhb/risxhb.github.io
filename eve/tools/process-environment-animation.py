from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT / "assets" / "runs" / "environment-animation"
TREE_OUT = ROOT / "assets" / "props" / "tutorial"
TILE_OUT = ROOT / "assets" / "tiles" / "tutorial"
MANIFEST_PATH = ROOT / "data" / "asset_manifest.json"
TREE_FRAME = 128
WATER_FRAME = 32
FRAMES = 4


TREE_RUNS = {
    "prop.tutorial.tree.wind": ("tree-base", "tree-wind.png"),
    "prop.tutorial.tree.maple.wind": ("tree-maple", "tree-maple-wind.png"),
    "prop.tutorial.tree.pine.wind": ("tree-pine", "tree-pine-wind.png"),
}


def alpha_bbox(image: Image.Image):
    return image.getchannel("A").getbbox()


def key_magenta(source: Image.Image) -> Image.Image:
    image = source.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if r > 170 and b > 170 and g < 95:
                pixels[x, y] = (r, g, b, 0)
            elif r > 130 and b > 130 and g < 125:
                pixels[x, y] = (r, g, b, min(a, 32))
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


def normalize_tree_frame(cell: Image.Image) -> Image.Image:
    bbox = alpha_bbox(cell)
    frame = Image.new("RGBA", (TREE_FRAME, TREE_FRAME), (0, 0, 0, 0))
    if not bbox:
        return frame
    subject = cell.crop(bbox)
    scale = min(116 / subject.width, 120 / subject.height)
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    x = (TREE_FRAME - resized.width) // 2
    y = TREE_FRAME - resized.height - 3
    frame.alpha_composite(resized, (x, y))
    return frame


def process_tree(asset_id: str, run_id: str, filename: str) -> dict:
    source_path = RUN_ROOT / run_id / "source.png"
    source = key_magenta(Image.open(source_path))
    cell_w = source.width / FRAMES
    sheet = Image.new("RGBA", (TREE_FRAME * FRAMES, TREE_FRAME), (0, 0, 0, 0))
    frame_reports = []
    for col in range(FRAMES):
        cell = source.crop((round(col * cell_w), 0, round((col + 1) * cell_w), source.height))
        frame = normalize_tree_frame(cell)
        sheet.alpha_composite(frame, (col * TREE_FRAME, 0))
        frame_reports.append({"col": col, "edge_alpha_pixels": edge_alpha_pixels(frame), "empty": alpha_bbox(frame) is None})
    out_path = TREE_OUT / filename
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)
    report = {
        "asset": asset_id,
        "source": source_path.relative_to(ROOT).as_posix(),
        "output": out_path.relative_to(ROOT).as_posix(),
        "width": sheet.width,
        "height": sheet.height,
        "edge_alpha_pixels": edge_alpha_pixels(sheet),
        "frames": frame_reports,
    }
    (RUN_ROOT / run_id / "validation.json").write_text(json.dumps(report, indent=2), encoding="utf8")
    return report


def process_water() -> dict:
    source_path = RUN_ROOT / "water" / "source.png"
    source = Image.open(source_path).convert("RGBA")
    cell_w = source.width / FRAMES
    sheet = Image.new("RGBA", (WATER_FRAME * FRAMES, WATER_FRAME), (0, 0, 0, 255))
    for col in range(FRAMES):
        cell = source.crop((round(col * cell_w), 0, round((col + 1) * cell_w), source.height))
        tile = cell.resize((WATER_FRAME, WATER_FRAME), Image.Resampling.BICUBIC)
        sheet.alpha_composite(tile, (col * WATER_FRAME, 0))
    out_path = TILE_OUT / "water-shimmer.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)
    report = {
        "asset": "tile.tutorial.water.shimmer",
        "source": source_path.relative_to(ROOT).as_posix(),
        "output": out_path.relative_to(ROOT).as_posix(),
        "width": sheet.width,
        "height": sheet.height,
        "edge_alpha_pixels": 0,
    }
    (RUN_ROOT / "water" / "validation.json").write_text(json.dumps(report, indent=2), encoding="utf8")
    return report


def update_manifest(tree_reports: list[dict], water_report: dict) -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf8"))
    images = manifest.setdefault("images", {})
    for report in tree_reports:
        images[report["asset"]] = {
            "kind": "spritesheet",
            "path": report["output"],
            "width": report["width"],
            "height": report["height"],
            "source_run": str(Path(report["source"]).parent).replace("\\", "/"),
            "edge_alpha_pixels": report["edge_alpha_pixels"],
            "animation": {
                "name": "wind",
                "frame_width": TREE_FRAME,
                "frame_height": TREE_FRAME,
                "frames": FRAMES,
                "fps": 2,
            },
        }
    images[water_report["asset"]] = {
        "kind": "spritesheet",
        "path": water_report["output"],
        "width": water_report["width"],
        "height": water_report["height"],
        "source_run": str(Path(water_report["source"]).parent).replace("\\", "/"),
        "edge_alpha_pixels": 0,
        "animation": {
            "name": "shimmer",
            "frame_width": WATER_FRAME,
            "frame_height": WATER_FRAME,
            "frames": FRAMES,
            "fps": 5,
        },
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf8")


def main() -> None:
    tree_reports = [process_tree(asset_id, run_id, filename) for asset_id, (run_id, filename) in TREE_RUNS.items()]
    water_report = process_water()
    bad = [
        f"{report['asset']} edge_alpha_pixels={report['edge_alpha_pixels']}"
        for report in tree_reports
        if report["edge_alpha_pixels"] != 0
    ]
    bad.extend(
        f"{report['asset']} col={frame['col']} empty={frame['empty']} edge={frame['edge_alpha_pixels']}"
        for report in tree_reports
        for frame in report["frames"]
        if frame["empty"] or frame["edge_alpha_pixels"] != 0
    )
    if bad:
        raise SystemExit("\n".join(bad))
    update_manifest(tree_reports, water_report)
    print(json.dumps({"ok": True, "trees": [r["asset"] for r in tree_reports], "water": water_report["asset"]}, indent=2))


if __name__ == "__main__":
    main()
