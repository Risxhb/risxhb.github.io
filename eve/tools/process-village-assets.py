import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT / "assets" / "runs" / "brindlemarket-village"
SOURCE = RUN_ROOT / "source.png"
OUT_DIR = ROOT / "assets" / "village"
MANIFEST = ROOT / "data" / "asset_manifest.json"
KEY = (255, 0, 255)


SPECS = [
    {"id": "village.roof.shop", "file": "roof-shop.png", "cell": (0, 0), "size": (192, 176), "fit": 0.97},
    {"id": "village.roof.guild", "file": "roof-guild.png", "cell": (1, 0), "size": (192, 176), "fit": 0.97},
    {"id": "village.roof.inn", "file": "roof-inn.png", "cell": (2, 0), "size": (192, 176), "fit": 0.97},
    {"id": "village.roof.home", "file": "roof-home.png", "cell": (3, 0), "size": (176, 160), "fit": 0.9},
    {"id": "village.interior.shop", "file": "interior-shop.png", "cell": (0, 1), "size": (192, 192), "fit": 0.9, "center": True},
    {"id": "village.interior.guild", "file": "interior-guild.png", "cell": (1, 1), "size": (192, 192), "fit": 0.9, "center": True},
    {"id": "village.interior.inn", "file": "interior-inn.png", "cell": (2, 1), "size": (192, 192), "fit": 0.9, "center": True},
    {"id": "village.interior.home", "file": "interior-home.png", "cell": (3, 1), "size": (176, 176), "fit": 0.88, "center": True},
    {"id": "village.fountain", "file": "fountain.png", "cell": (0, 2), "size": (128, 128), "fit": 0.96},
    {"id": "village.market-stall", "file": "market-stall.png", "cell": (1, 2), "size": (128, 112), "fit": 0.96},
    {"id": "village.dungeon-supplies", "file": "dungeon-supplies.png", "cell": (2, 2), "size": (128, 112), "fit": 0.96},
    {"id": "village.notice-board", "file": "notice-board.png", "cell": (3, 2), "size": (128, 112), "fit": 0.96},
    {"id": "village.lantern", "file": "lantern.png", "cell": (0, 3), "size": (64, 96), "fit": 0.95},
    {"id": "village.bench", "file": "bench.png", "cell": (1, 3), "size": (112, 64), "fit": 0.96},
    {"id": "village.ore-bundle", "file": "ore-bundle.png", "cell": (2, 3), "size": (96, 96), "fit": 0.95},
    {"id": "village.herb-bundle", "file": "herb-bundle.png", "cell": (3, 3), "size": (96, 96), "fit": 0.95},
]


def key_to_alpha(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if abs(r - KEY[0]) < 34 and abs(g - KEY[1]) < 34 and abs(b - KEY[2]) < 34:
                pixels[x, y] = (r, g, b, 0)
    return image


def edge_alpha_pixels(image: Image.Image) -> int:
    alpha = image.getchannel("A")
    total = 0
    for x in range(image.width):
        total += alpha.getpixel((x, 0)) > 0
        total += alpha.getpixel((x, image.height - 1)) > 0
    for y in range(image.height):
        total += alpha.getpixel((0, y)) > 0
        total += alpha.getpixel((image.width - 1, y)) > 0
    return int(total)


def fit_padded(cell: Image.Image, width: int, height: int, fit: float, center: bool = False) -> Image.Image:
    bbox = cell.getchannel("A").getbbox()
    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    if not bbox:
        return out
    trimmed = cell.crop(bbox)
    trimmed.thumbnail((int(width * fit), int(height * fit)), Image.Resampling.LANCZOS)
    x = (width - trimmed.width) // 2
    y = (height - trimmed.height) // 2 if center else height - trimmed.height - max(2, round(height * 0.03))
    out.alpha_composite(trimmed, (x, y))
    return out


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    RUN_ROOT.mkdir(parents=True, exist_ok=True)
    source = key_to_alpha(Image.open(SOURCE))
    cell_w = source.width / 4
    cell_h = source.height / 4
    report = {"source": SOURCE.relative_to(ROOT).as_posix(), "assets": []}

    with MANIFEST.open("r", encoding="utf-8") as file:
        manifest = json.load(file)
    images = manifest.setdefault("images", {})

    for spec in SPECS:
        col, row = spec["cell"]
        crop = source.crop((
            round(col * cell_w),
            round(row * cell_h),
            round((col + 1) * cell_w),
            round((row + 1) * cell_h),
        ))
        processed = fit_padded(crop, spec["size"][0], spec["size"][1], spec["fit"], spec.get("center", False))
        edge_pixels = edge_alpha_pixels(processed)
        out_path = OUT_DIR / spec["file"]
        processed.save(out_path)
        rel = out_path.relative_to(ROOT).as_posix()
        images[spec["id"]] = {
            "kind": "standalone",
            "path": rel,
            "width": spec["size"][0],
            "height": spec["size"][1],
            "source_run": "assets/runs/brindlemarket-village",
            "edge_alpha_pixels": edge_pixels,
        }
        report["assets"].append({
            "id": spec["id"],
            "path": rel,
            "cell": list(spec["cell"]),
            "size": list(spec["size"]),
            "edge_alpha_pixels": edge_pixels,
        })

    with MANIFEST.open("w", encoding="utf-8") as file:
        json.dump(manifest, file, indent=2)
        file.write("\n")
    with (RUN_ROOT / "validation.json").open("w", encoding="utf-8") as file:
        json.dump(report, file, indent=2)
        file.write("\n")


if __name__ == "__main__":
    main()
