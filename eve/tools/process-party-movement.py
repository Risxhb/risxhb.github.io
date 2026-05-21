from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT / "assets" / "runs" / "party-movement"
OUT_ROOT = ROOT / "assets" / "actors" / "party"
MANIFEST_PATH = ROOT / "data" / "asset_manifest.json"
FRAME = 64
COLS = 4
ROWS = 4
CHARACTERS = ("rowan", "elara", "cassian", "nia")
ROWS_META = {"down": 0, "left": 1, "right": 2, "up": 3}


def keyed_alpha(source: Image.Image) -> Image.Image:
    image = source.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if g > 115 and g - r > 45 and g - b > 45:
                pixels[x, y] = (r, g, b, 0)
            elif g > 95 and g - r > 24 and g - b > 24:
                pixels[x, y] = (r, g, b, min(a, 28))
    return image


def alpha_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    return alpha.getbbox()


def edge_alpha_pixels(image: Image.Image) -> int:
    alpha = image.getchannel("A")
    w, h = image.size
    total = 0
    for x in range(w):
        if alpha.getpixel((x, 0)) > 0:
            total += 1
        if alpha.getpixel((x, h - 1)) > 0:
            total += 1
    for y in range(h):
        if alpha.getpixel((0, y)) > 0:
            total += 1
        if alpha.getpixel((w - 1, y)) > 0:
            total += 1
    return total


def normalize_frame(cell: Image.Image) -> Image.Image:
    bbox = alpha_bbox(cell)
    frame = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    if not bbox:
        return frame
    subject = cell.crop(bbox)
    scale = min(58 / subject.width, 61 / subject.height, 1.0)
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    x = (FRAME - resized.width) // 2
    y = FRAME - resized.height - 2
    frame.alpha_composite(resized, (x, y))
    return frame


def fit_frame(frame: Image.Image, max_w: int = 58, max_h: int = 61, bottom_pad: int = 2) -> Image.Image:
    bbox = alpha_bbox(frame)
    fitted = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    if not bbox:
        return fitted
    subject = frame.crop(bbox)
    scale = min(max_w / subject.width, max_h / subject.height, 1.0)
    resized = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    x = (FRAME - resized.width) // 2
    y = FRAME - resized.height - bottom_pad
    fitted.alpha_composite(resized, (x, y))
    return fitted


def fit_frame_exact(frame: Image.Image, target_w: int, target_h: int = 61, bottom_pad: int = 2) -> Image.Image:
    bbox = alpha_bbox(frame)
    fitted = Image.new("RGBA", (FRAME, FRAME), (0, 0, 0, 0))
    if not bbox:
        return fitted
    subject = frame.crop(bbox)
    resized = subject.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = (FRAME - resized.width) // 2
    y = FRAME - resized.height - bottom_pad
    fitted.alpha_composite(resized, (x, y))
    return fitted


def frame_delta(a: Image.Image, b: Image.Image) -> float:
    diff = ImageChops.difference(a.convert("RGBA"), b.convert("RGBA"))
    return sum(sum(pixel) for pixel in diff.getdata()) / 255


def row_motion_report(frames: dict[tuple[int, int], Image.Image], row: int) -> dict:
    deltas = [round(frame_delta(frames[(row, col)], frames[(row, col + 1)]), 2) for col in range(COLS - 1)]
    boxes = []
    for col in range(COLS):
        bbox = alpha_bbox(frames[(row, col)])
        boxes.append(None if not bbox else {"x": bbox[0], "y": bbox[1], "w": bbox[2] - bbox[0], "h": bbox[3] - bbox[1]})
    return {"deltas": deltas, "min_delta": min(deltas), "boxes": boxes}


def process_character(actor_id: str) -> dict:
    source_path = RUN_ROOT / actor_id / "source.png"
    if not source_path.exists():
        raise FileNotFoundError(source_path)
    source = keyed_alpha(Image.open(source_path))
    cell_w = source.width / COLS
    cell_h = source.height / ROWS
    normalized_frames = {}
    for row in range(ROWS):
        for col in range(COLS):
            left = round(col * cell_w)
            top = round(row * cell_h)
            right = round((col + 1) * cell_w)
            bottom = round((row + 1) * cell_h)
            cell = source.crop((left, top, right, bottom))
            normalized = normalize_frame(cell)
            normalized_frames[(row, col)] = normalized

    if actor_id in {"rowan", "elara", "cassian", "nia"}:
        left = ROWS_META["left"]
        right = ROWS_META["right"]
        for col in range(COLS):
            normalized_frames[(right, col)] = normalized_frames[(left, col)].transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    if actor_id == "rowan":
        left = ROWS_META["left"]
        right = ROWS_META["right"]
        up = ROWS_META["up"]
        # Rowan's generated side-row frame 0 is a profile idle pose with a
        # visibly larger silhouette than the run frames. Build the runtime
        # side cycle from the consistent running poses so his width no longer
        # pulses while moving left/right.
        original_side_frames = [normalized_frames[(left, col)].copy() for col in range(COLS)]
        side_cycle = [1, 2, 3, 2]
        for col, source_col in enumerate(side_cycle):
            normalized_frames[(left, col)] = original_side_frames[source_col].copy()
        side_widths = [56, 56, 56, 56]
        up_widths = [48, 52, 56, 56]
        for col in range(COLS):
            normalized_frames[(left, col)] = fit_frame_exact(normalized_frames[(left, col)], side_widths[col])
            normalized_frames[(right, col)] = normalized_frames[(left, col)].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            normalized_frames[(up, col)] = fit_frame_exact(normalized_frames[(up, col)], up_widths[col])

    sheet = Image.new("RGBA", (FRAME * COLS, FRAME * ROWS), (0, 0, 0, 0))
    frame_reports = []
    for row in range(ROWS):
        for col in range(COLS):
            normalized = normalized_frames[(row, col)]
            sheet.alpha_composite(normalized, (col * FRAME, row * FRAME))
            frame_reports.append(
                {
                    "row": row,
                    "col": col,
                    "edge_alpha_pixels": edge_alpha_pixels(normalized),
                    "empty": alpha_bbox(normalized) is None,
                }
            )
    out_path = OUT_ROOT / f"{actor_id}-move.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)
    report = {
        "actor": actor_id,
        "source": source_path.relative_to(ROOT).as_posix(),
        "output": out_path.relative_to(ROOT).as_posix(),
        "width": sheet.width,
        "height": sheet.height,
        "edge_alpha_pixels": edge_alpha_pixels(sheet),
        "motion": {
            "left": row_motion_report(normalized_frames, ROWS_META["left"]),
            "right": row_motion_report(normalized_frames, ROWS_META["right"]),
        },
        "frames": frame_reports,
    }
    (RUN_ROOT / actor_id / "validation.json").write_text(json.dumps(report, indent=2), encoding="utf8")
    return report


def update_manifest(reports: list[dict]) -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf8"))
    images = manifest.setdefault("images", {})
    for report in reports:
        actor_id = report["actor"]
        images[f"actor.{actor_id}.move"] = {
            "kind": "spritesheet",
            "path": report["output"],
            "width": report["width"],
            "height": report["height"],
            "source_run": f"assets/runs/party-movement/{actor_id}",
            "edge_alpha_pixels": report["edge_alpha_pixels"],
            "animation": {
                "name": "run-4dir",
                "frame_width": FRAME,
                "frame_height": FRAME,
                "frames": 4,
                "fps": 8,
                "rows": ROWS_META,
            },
        }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf8")


def main() -> None:
    reports = [process_character(actor_id) for actor_id in CHARACTERS]
    bad = [
        f"{report['actor']} edge_alpha_pixels={report['edge_alpha_pixels']}"
        for report in reports
        if report["edge_alpha_pixels"] != 0
    ]
    bad.extend(
        f"{report['actor']} row={frame['row']} col={frame['col']} empty={frame['empty']} edge={frame['edge_alpha_pixels']}"
        for report in reports
        for frame in report["frames"]
        if frame["empty"] or frame["edge_alpha_pixels"] != 0
    )
    bad.extend(
        f"rowan {direction} low-motion deltas={reports[0]['motion'][direction]['deltas']}"
        for direction in ("left", "right")
        if reports[0]["actor"] == "rowan" and reports[0]["motion"][direction]["min_delta"] < 450
    )
    if bad:
        raise SystemExit("\n".join(bad))
    update_manifest(reports)
    print(json.dumps({"ok": True, "processed": [r["actor"] for r in reports]}, indent=2))


if __name__ == "__main__":
    main()
