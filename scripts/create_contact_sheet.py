from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from sprite_utils import load_request, rows_by_index, utc_now, write_json


def create_contact_sheet(run_dir: Path) -> dict:
    request = load_request(run_dir)
    atlas = request["atlas"]
    cell_w = atlas["cell_width"]
    cell_h = atlas["cell_height"]
    label_w = 160
    pad = 12
    rows = rows_by_index(request)
    width = label_w + atlas["columns"] * cell_w + pad * 2
    height = pad + len(rows) * (cell_h + pad)
    image = Image.new("RGBA", (width, height), (245, 245, 245, 255))
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    row_reports = []

    for visual_index, row in enumerate(rows):
        y = pad + visual_index * (cell_h + pad)
        draw.text((pad, y + 8), row["state"], fill=(0, 0, 0, 255), font=font)
        draw.text((pad, y + 24), f"{row['frames']} frames", fill=(80, 80, 80, 255), font=font)
        frame_reports = []
        for column in range(atlas["columns"]):
            x = label_w + column * cell_w
            draw.rectangle([x, y, x + cell_w - 1, y + cell_h - 1], outline=(180, 180, 180, 255))
            frame_path = run_dir / "frames" / row["state"] / f"{column:02d}.png"
            if column < row["frames"] and frame_path.exists():
                with Image.open(frame_path) as frame:
                    image.alpha_composite(frame.convert("RGBA"), (x, y))
                frame_reports.append({"index": column, "file": str(frame_path.resolve()), "present": True})
            elif column < row["frames"]:
                draw.line([x, y, x + cell_w - 1, y + cell_h - 1], fill=(180, 0, 0, 255), width=3)
                draw.line([x + cell_w - 1, y, x, y + cell_h - 1], fill=(180, 0, 0, 255), width=3)
                frame_reports.append({"index": column, "file": str(frame_path.resolve()), "present": False})
        row_reports.append({"state": row["state"], "frames": frame_reports})

    qa_dir = run_dir / "qa"
    qa_dir.mkdir(parents=True, exist_ok=True)
    contact_path = qa_dir / "contact-sheet.png"
    image.save(contact_path)
    review = {
        "ok": all(frame["present"] for row in row_reports for frame in row["frames"]),
        "created_at": utc_now(),
        "contact_sheet": str(contact_path.resolve()),
        "review_prompts": [
            "Is subject identity consistent across all rows?",
            "Does each pose read clearly at cell size?",
            "Are any frames cropped or touching the cell edge?",
            "Do the animation beats read in order?",
            "Are there guide marks, labels, scenery, shadows, or chroma-key remnants?",
        ],
        "rows": row_reports,
    }
    write_json(qa_dir / "review.json", review)
    return review


def main() -> None:
    parser = argparse.ArgumentParser(description="Create QA contact sheet and review JSON.")
    parser.add_argument("--run-dir", type=Path, required=True)
    args = parser.parse_args()
    review = create_contact_sheet(args.run_dir)
    print(f"Contact sheet ok={review['ok']} path={review['contact_sheet']}")


if __name__ == "__main__":
    main()
