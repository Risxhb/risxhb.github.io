from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

from sprite_utils import load_request, rows_by_index


def build_spritesheet(run_dir: Path) -> tuple[Path, Path]:
    request = load_request(run_dir)
    atlas = request["atlas"]
    cell_w = atlas["cell_width"]
    cell_h = atlas["cell_height"]
    sheet = Image.new("RGBA", (atlas["width"], atlas["height"]), (0, 0, 0, 0))

    for row in rows_by_index(request):
        state = row["state"]
        row_index = row["row"]
        for index in range(row["frames"]):
            frame_path = run_dir / "frames" / state / f"{index:02d}.png"
            if not frame_path.exists():
                raise FileNotFoundError(f"Missing frame: {frame_path}")
            with Image.open(frame_path) as frame:
                frame = frame.convert("RGBA")
                if frame.size != (cell_w, cell_h):
                    frame = frame.resize((cell_w, cell_h), Image.Resampling.LANCZOS)
                sheet.alpha_composite(frame, (index * cell_w, row_index * cell_h))

    final_dir = run_dir / "final"
    final_dir.mkdir(parents=True, exist_ok=True)
    png_path = final_dir / "spritesheet.png"
    webp_path = final_dir / "spritesheet.webp"
    sheet.save(png_path)
    sheet.save(webp_path, lossless=True, quality=100, method=6)
    return png_path, webp_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Build final PNG and WebP sprite atlases.")
    parser.add_argument("--run-dir", type=Path, required=True)
    args = parser.parse_args()
    png_path, webp_path = build_spritesheet(args.run_dir)
    print(f"Wrote {png_path}")
    print(f"Wrote {webp_path}")


if __name__ == "__main__":
    main()
