from __future__ import annotations

import argparse
import colorsys
import json
from pathlib import Path

from PIL import Image, ImageChops


FRAME_W = 192
FRAME_H = 256
SHEET_W = 1536
SHEET_H = 2048


def chroma_to_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            green_gap = min(g - r, g - b)
            hue, sat, val = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            hue = hue * 360
            green_hue = 70 <= hue <= 160 and sat > 0.24 and val > 0.10
            if green_hue and (sat > 0.38 or green_gap > 26):
                pixels[x, y] = (r, g, b, 0)
            elif green_hue or (g > 80 and green_gap > 20):
                fade = max(0, min(255, int((0.38 - sat) / 0.14 * 255)))
                pixels[x, y] = (r, g, b, min(a, fade))
    return rgba


def component_boxes(image: Image.Image) -> list[tuple[int, int, int, int]]:
    rgba = chroma_to_alpha(image)
    alpha = rgba.getchannel("A")
    width, height = rgba.size
    active_columns = []
    for x in range(width):
        count = 0
        for y in range(height):
            if alpha.getpixel((x, y)) > 10:
                count += 1
        active_columns.append(count > 6)

    runs: list[list[int]] = []
    x = 0
    while x < width:
        if not active_columns[x]:
            x += 1
            continue
        start = x
        while x < width and active_columns[x]:
            x += 1
        runs.append([start, x])

    merged: list[list[int]] = []
    for run in runs:
        if merged and run[0] - merged[-1][1] < 16:
            merged[-1][1] = run[1]
        else:
            merged.append(run)

    boxes: list[tuple[int, int, int, int]] = []
    for start, end in merged:
        if end - start < 24:
            continue
        bbox = alpha.crop((start, 0, end, height)).getbbox()
        if not bbox:
            continue
        x0, y0, x1, y1 = bbox
        boxes.append((max(0, start + x0 - 2), max(0, y0 - 2), min(width, start + x1 + 2), min(height, y1 + 2)))

    if len(boxes) == 8:
        return boxes

    whole = alpha.getbbox()
    if whole is None:
        raise ValueError("source image has no visible subject after chroma removal")
    x0, _, x1, _ = whole
    stride = (x1 - x0) / 8
    boxes = []
    for frame in range(8):
        sx0 = int(x0 + stride * frame)
        sx1 = int(x0 + stride * (frame + 1))
        bbox = alpha.crop((sx0, 0, sx1, height)).getbbox()
        if not bbox:
            raise ValueError(f"could not isolate source component {frame + 1}")
        bx0, by0, bx1, by1 = bbox
        boxes.append((max(0, sx0 + bx0 - 2), max(0, by0 - 2), min(width, sx0 + bx1 + 2), min(height, by1 + 2)))
    return boxes


def normalize_source_row(image: Image.Image, target_height: int, baseline_y: int) -> Image.Image:
    rgba = chroma_to_alpha(image)
    row = Image.new("RGBA", (SHEET_W, FRAME_H), (0, 0, 0, 0))
    for frame, box in enumerate(component_boxes(image)):
        sprite = rgba.crop(box)
        if sprite.getchannel("A").getbbox() is None:
            raise ValueError(f"source component {frame + 1} is empty")
        scale = target_height / sprite.height
        new_w = max(1, int(round(sprite.width * scale)))
        new_h = max(1, int(round(sprite.height * scale)))
        if new_w > FRAME_W - 18:
            scale = (FRAME_W - 18) / sprite.width
            new_w = max(1, int(round(sprite.width * scale)))
            new_h = max(1, int(round(sprite.height * scale)))
        sprite = sprite.resize((new_w, new_h), Image.Resampling.LANCZOS)
        x = frame * FRAME_W + (FRAME_W - new_w) // 2
        y = baseline_y - new_h
        row.alpha_composite(sprite, (x, y))
    return row


def soften_horizontal_mask(mask: Image.Image, split_y: int, feather: int, keep_above: bool) -> Image.Image:
    out = Image.new("L", mask.size, 0)
    src = mask.load()
    dst = out.load()
    width, height = mask.size
    for y in range(height):
        if keep_above:
            if y <= split_y - feather:
                weight = 1.0
            elif y >= split_y + feather:
                weight = 0.0
            else:
                weight = (split_y + feather - y) / max(1, feather * 2)
        else:
            if y >= split_y + feather:
                weight = 1.0
            elif y <= split_y - feather:
                weight = 0.0
            else:
                weight = (y - (split_y - feather)) / max(1, feather * 2)
        for x in range(width):
            dst[x, y] = int(src[x, y] * max(0.0, min(1.0, weight)))
    return out


def compose_row(
    lower: Image.Image,
    upper: Image.Image,
    split_y: int,
    feather: int,
    lower_height: int,
    upper_height: int,
    baseline_y: int,
) -> Image.Image:
    lower = normalize_source_row(lower, lower_height, baseline_y)
    upper = normalize_source_row(upper, upper_height, baseline_y)
    row = Image.new("RGBA", (SHEET_W, FRAME_H), (0, 0, 0, 0))

    for frame in range(8):
        box = (frame * FRAME_W, 0, (frame + 1) * FRAME_W, FRAME_H)
        upper_cell = upper.crop(box)
        lower_cell = lower.crop(box)

        upper_alpha = upper_cell.getchannel("A")
        lower_alpha = lower_cell.getchannel("A")
        upper_mask = soften_horizontal_mask(upper_alpha, split_y, feather, keep_above=True)
        lower_mask = soften_horizontal_mask(lower_alpha, split_y, feather, keep_above=False)

        cell = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        cell.alpha_composite(upper_cell)
        clipped_upper = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        clipped_upper.paste(upper_cell, (0, 0), upper_mask)
        cell = clipped_upper
        cell.paste(lower_cell, (0, 0), lower_mask)
        row.alpha_composite(cell, (frame * FRAME_W, 0))

    return row


def make_preview(row: Image.Image) -> Image.Image:
    green = Image.new("RGBA", row.size, (0, 255, 0, 255))
    green.alpha_composite(row)
    dark = Image.new("RGBA", row.size, (24, 24, 24, 255))
    dark.alpha_composite(row)
    preview = Image.new("RGBA", (SHEET_W, FRAME_H * 2), (0, 0, 0, 255))
    preview.alpha_composite(green, (0, 0))
    preview.alpha_composite(dark, (0, FRAME_H))
    return preview


def remove_small_alpha_islands(image: Image.Image, min_area: int = 260) -> Image.Image:
    rgba = image.copy()
    alpha = rgba.getchannel("A")
    width, height = rgba.size
    visited = bytearray(width * height)
    pixels_to_clear: list[tuple[int, int]] = []

    for sy in range(height):
        for sx in range(width):
            idx = sy * width + sx
            if visited[idx] or alpha.getpixel((sx, sy)) <= 8:
                visited[idx] = 1
                continue
            stack = [(sx, sy)]
            visited[idx] = 1
            component: list[tuple[int, int]] = []
            while stack:
                x, y = stack.pop()
                component.append((x, y))
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    nidx = ny * width + nx
                    if visited[nidx]:
                        continue
                    visited[nidx] = 1
                    if alpha.getpixel((nx, ny)) > 8:
                        stack.append((nx, ny))
            if len(component) < min_area:
                pixels_to_clear.extend(component)

    px = rgba.load()
    for x, y in pixels_to_clear:
        px[x, y] = (0, 0, 0, 0)
    return rgba


def stamp_row(sheet_path: Path, row: Image.Image, row_index: int) -> None:
    sheet = Image.open(sheet_path).convert("RGBA")
    if sheet.size != (SHEET_W, SHEET_H):
        raise ValueError(f"{sheet_path} must be {SHEET_W}x{SHEET_H}, got {sheet.size}")
    y = row_index * FRAME_H
    sheet.paste((0, 0, 0, 0), (0, y, SHEET_W, y + FRAME_H))
    sheet.alpha_composite(row, (0, y))
    sheet.save(sheet_path)


def validate_row(row: Image.Image) -> dict:
    data = {"size": row.size, "frames": []}
    for frame in range(8):
        cell = row.crop((frame * FRAME_W, 0, (frame + 1) * FRAME_W, FRAME_H))
        bbox = cell.getchannel("A").getbbox()
        if bbox is None:
            raise ValueError(f"frame {frame + 1} is empty")
        if bbox[0] <= 0 or bbox[2] >= FRAME_W:
            raise ValueError(f"frame {frame + 1} touches horizontal cell edge: {bbox}")
        data["frames"].append({"frame": frame + 1, "bbox": bbox})
    return data


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--direction", required=True)
    parser.add_argument("--row-index", type=int, required=True)
    parser.add_argument("--lower", required=True, type=Path)
    parser.add_argument("--upper", required=True, type=Path)
    parser.add_argument("--out-row", required=True, type=Path)
    parser.add_argument("--preview", required=True, type=Path)
    parser.add_argument("--metadata", required=True, type=Path)
    parser.add_argument("--sheet", action="append", type=Path, default=[])
    parser.add_argument("--split-y", type=int, default=126)
    parser.add_argument("--feather", type=int, default=18)
    parser.add_argument("--lower-height", type=int, default=152)
    parser.add_argument("--upper-height", type=int, default=218)
    parser.add_argument("--baseline-y", type=int, default=250)
    args = parser.parse_args()

    row = compose_row(
        Image.open(args.lower),
        Image.open(args.upper),
        args.split_y,
        args.feather,
        args.lower_height,
        args.upper_height,
        args.baseline_y,
    )
    row = remove_small_alpha_islands(row)
    validation = validate_row(row)

    args.out_row.parent.mkdir(parents=True, exist_ok=True)
    row.save(args.out_row)
    make_preview(row).save(args.preview)
    for sheet_path in args.sheet:
        stamp_row(sheet_path, row, args.row_index)

    args.metadata.write_text(
        json.dumps(
            {
                "asset": f"nia-{args.direction}-row-two-pass-v6",
                "direction": args.direction,
                "row_index": args.row_index,
                "lower_source": str(args.lower).replace("\\", "/"),
                "upper_source": str(args.upper).replace("\\", "/"),
                "normalized_row": str(args.out_row).replace("\\", "/"),
                "preview": str(args.preview).replace("\\", "/"),
                "validation": validation,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
