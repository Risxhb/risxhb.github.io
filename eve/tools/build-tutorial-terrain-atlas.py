from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RUN_DIR = ROOT / "assets/runs/tutorial-terrain"
OUT = ROOT / "assets/atlases/tutorial-terrain.png"
KEY = (255, 0, 255)


TILES = {
    "grass": ((78, 92, 174, 188), (0, 0, 32, 32)),
    "grassFlowers": ((318, 105, 414, 201), (32, 0, 32, 32)),
    "path": ((576, 98, 672, 194), (64, 0, 32, 32)),
    "pathH": ((804, 122, 900, 218), (96, 0, 32, 32)),
    "pathV": ((1049, 111, 1145, 207), (128, 0, 32, 32)),
    "water": ((78, 352, 174, 448), (160, 0, 32, 32)),
    "waterLeft": ((309, 352, 405, 448), (192, 0, 32, 32)),
    "waterRight": ((556, 352, 652, 448), (224, 0, 32, 32)),
    "shore": ((784, 402, 880, 498), (256, 0, 32, 32)),
    "bridge": ((1052, 360, 1148, 456), (288, 0, 32, 32)),
}

PROPS = {
    "tree": ((25, 555, 256, 790), (0, 64, 128, 128)),
    "pine": ((350, 554, 486, 782), (128, 64, 96, 128)),
    "flowers": ((535, 641, 642, 755), (224, 64, 64, 64)),
    "rocks": ((729, 621, 849, 755), (288, 64, 80, 80)),
    "log": ((974, 613, 1257, 747), (368, 64, 144, 80)),
    "waystone": ((1338, 569, 1476, 773), (0, 224, 96, 128)),
    "campfire": ((363, 837, 511, 973), (96, 224, 96, 96)),
    "crate": ((558, 842, 665, 963), (192, 224, 72, 72)),
    "slimeMarker": ((752, 852, 912, 951), (264, 224, 96, 72)),
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


def paste_fit(sheet: Image.Image, source: Image.Image, crop, dest) -> None:
    sx0, sy0, sx1, sy1 = crop
    dx, dy, dw, dh = dest
    cut = source.crop((sx0, sy0, sx1, sy1))
    cut = cut.resize((dw, dh), Image.Resampling.LANCZOS)
    sheet.alpha_composite(cut, (dx, dy))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the tutorial terrain atlas from a source PNG.")
    parser.add_argument("--source", required=True, type=Path, help="Path to the generated source PNG.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source_path = args.source.expanduser().resolve()
    if not source_path.exists():
        raise FileNotFoundError(f"Source image not found: {source_path}")
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    source = Image.open(source_path)
    (RUN_DIR / "source.png").write_bytes(source_path.read_bytes())
    keyed = key_to_alpha(source)
    sheet = Image.new("RGBA", (512, 384), (0, 0, 0, 0))
    for crop, dest in TILES.values():
        paste_fit(sheet, keyed, crop, dest)
    for crop, dest in PROPS.values():
        paste_fit(sheet, keyed, crop, dest)
    sheet.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
