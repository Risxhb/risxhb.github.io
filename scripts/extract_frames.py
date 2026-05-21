from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

from sprite_utils import chroma_rgb, load_request, rows_by_index, utc_now, write_json


def key_to_alpha(image: Image.Image, key: tuple[int, int, int], threshold: int) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    kr, kg, kb = key
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            distance = abs(r - kr) + abs(g - kg) + abs(b - kb)
            if distance <= threshold:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def frame_stats(frame: Image.Image) -> dict:
    alpha = frame.getchannel("A")
    bbox = alpha.getbbox()
    nontransparent = sum(1 for value in alpha.getdata() if value > 0)
    edge_pixels = 0
    if nontransparent:
        width, height = frame.size
        for x in range(width):
            if alpha.getpixel((x, 0)) > 0:
                edge_pixels += 1
            if alpha.getpixel((x, height - 1)) > 0:
                edge_pixels += 1
        for y in range(height):
            if alpha.getpixel((0, y)) > 0:
                edge_pixels += 1
            if alpha.getpixel((width - 1, y)) > 0:
                edge_pixels += 1
    return {
        "width": frame.width,
        "height": frame.height,
        "nontransparent_pixels": nontransparent,
        "bbox": list(bbox) if bbox else None,
        "edge_pixels": edge_pixels,
    }


def trim_to_alpha(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        return image
    return image.crop(bbox)


def fit_into_cell(image: Image.Image, width: int, height: int) -> Image.Image:
    frame = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    trimmed = trim_to_alpha(image)
    if not trimmed.getchannel("A").getbbox():
        return frame
    fitted = trimmed.copy()
    fitted.thumbnail((width, height), Image.Resampling.LANCZOS)
    x = (width - fitted.width) // 2
    y = (height - fitted.height) // 2
    frame.alpha_composite(fitted, (x, y))
    return frame


def extract_frames(run_dir: Path, threshold: int, source_mode: str) -> dict:
    request = load_request(run_dir)
    atlas = request["atlas"]
    cell_w = atlas["cell_width"]
    cell_h = atlas["cell_height"]
    key = chroma_rgb(request)
    rows = []
    errors = []
    warnings = []

    for row in rows_by_index(request):
        state = row["state"]
        frames = row["frames"]
        source_path = run_dir / "decoded" / f"{state}.png"
        out_dir = run_dir / "frames" / state
        out_dir.mkdir(parents=True, exist_ok=True)
        row_record = {
            "state": state,
            "expected_frames": frames,
            "actual_frames": 0,
            "extraction_method": source_mode,
            "ok": False,
            "errors": [],
            "warnings": [],
            "frames": [],
        }

        if not source_path.exists():
            message = f"Missing generated row strip: {source_path}"
            row_record["errors"].append(message)
            errors.append(message)
            rows.append(row_record)
            continue

        with Image.open(source_path) as source:
            transparent_source = key_to_alpha(source.convert("RGBA"), key, threshold)

        if source_mode == "slot-fit":
            source_for_slots = transparent_source
        elif source_mode == "trim-and-slice":
            source_for_slots = trim_to_alpha(transparent_source)
        elif source_mode == "full-image":
            source_for_slots = transparent_source
        else:
            raise ValueError(f"Unknown source mode: {source_mode}")

        if source_mode != "slot-fit":
            resized = source_for_slots.resize((frames * cell_w, cell_h), Image.Resampling.LANCZOS)

        for index in range(frames):
            if source_mode == "slot-fit":
                left = round(index * source_for_slots.width / frames)
                right = round((index + 1) * source_for_slots.width / frames)
                source_slot = source_for_slots.crop((left, 0, right, source_for_slots.height))
                frame = fit_into_cell(source_slot, cell_w, cell_h)
            else:
                frame = resized.crop((index * cell_w, 0, (index + 1) * cell_w, cell_h))
            frame_path = out_dir / f"{index:02d}.png"
            frame.save(frame_path)
            stats = frame_stats(frame)
            if stats["nontransparent_pixels"] == 0:
                warning = f"{state} frame {index:02d} is empty after chroma-key removal"
                row_record["warnings"].append(warning)
                warnings.append(warning)
            if stats["edge_pixels"] > 0:
                warning = f"{state} frame {index:02d} has nontransparent pixels on the canvas edge"
                row_record["warnings"].append(warning)
                warnings.append(warning)
            row_record["frames"].append({"index": index, "file": str(frame_path.resolve()), **stats})

        row_record["actual_frames"] = frames
        row_record["ok"] = not row_record["errors"]
        rows.append(row_record)

    manifest = {
        "ok": len(errors) == 0,
        "created_at": utc_now(),
        "frames_root": str((run_dir / "frames").resolve()),
        "chroma_key": {"rgb": list(key), "threshold": threshold},
        "errors": errors,
        "warnings": warnings,
        "rows": rows,
    }
    write_json(run_dir / "frames/frames-manifest.json", manifest)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract transparent frame PNGs from row strips.")
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--threshold", type=int, default=96)
    parser.add_argument(
        "--source-mode",
        choices=["slot-fit", "trim-and-slice", "full-image"],
        default="slot-fit",
        help="slot-fit splits the generated canvas into equal frame slots and fits each sprite without distortion",
    )
    args = parser.parse_args()
    manifest = extract_frames(args.run_dir, args.threshold, args.source_mode)
    print(f"Frame extraction ok={manifest['ok']} errors={len(manifest['errors'])} warnings={len(manifest['warnings'])}")


if __name__ == "__main__":
    main()
