from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from sprite_utils import load_request, rows_by_index


def create_layout_guides(run_dir: Path, request: dict) -> list[Path]:
    atlas = request["atlas"]
    cell_w = atlas["cell_width"]
    cell_h = atlas["cell_height"]
    margin_x = request.get("safe_margins", {}).get("x", 18)
    margin_y = request.get("safe_margins", {}).get("y", 16)
    out_dir = run_dir / "references/layout-guides"
    out_dir.mkdir(parents=True, exist_ok=True)
    font = ImageFont.load_default()
    created: list[Path] = []

    for row in rows_by_index(request):
        frames = row["frames"]
        width = frames * cell_w
        image = Image.new("RGBA", (width, cell_h), (255, 0, 255, 255))
        draw = ImageDraw.Draw(image)
        for i in range(frames):
            x0 = i * cell_w
            x1 = x0 + cell_w - 1
            draw.rectangle([x0, 0, x1, cell_h - 1], outline=(50, 50, 50, 255))
            draw.rectangle(
                [x0 + margin_x, margin_y, x1 - margin_x, cell_h - 1 - margin_y],
                outline=(255, 255, 255, 255),
            )
            center_x = x0 + cell_w // 2
            draw.line([center_x, margin_y, center_x, cell_h - 1 - margin_y], fill=(0, 0, 0, 255))
            label = str(i)
            draw.text((x0 + 6, 6), label, fill=(0, 0, 0, 255), font=font)

            beat = row.get("motion_beats", [])
            if i < len(beat):
                pose_y = int(cell_h * 0.55)
                if "jump" in row["state"] or "lift" in str(beat[i]) or "peak" in str(beat[i]):
                    pose_y = int(cell_h * (0.72 - min(i, frames - 1) / max(frames - 1, 1) * 0.28))
                elif "failed" in row["state"] or "deflate" in str(beat[i]) or "low" in str(beat[i]):
                    pose_y = int(cell_h * (0.5 + min(i, 4) * 0.06))
                draw.ellipse(
                    [center_x - 20, pose_y - 42, center_x + 20, pose_y + 2],
                    outline=(0, 0, 0, 255),
                )
                draw.line(
                    [center_x, pose_y + 2, center_x, pose_y + 44],
                    fill=(0, 0, 0, 255),
                )

        path = out_dir / f"{row['state']}.png"
        image.save(path)
        created.append(path)
    return created


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate row layout guide PNGs.")
    parser.add_argument("--run-dir", type=Path, required=True)
    args = parser.parse_args()
    run_dir = args.run_dir
    request = load_request(run_dir)
    created = create_layout_guides(run_dir, request)
    print(f"Created {len(created)} layout guides in {run_dir / 'references/layout-guides'}")


if __name__ == "__main__":
    main()
