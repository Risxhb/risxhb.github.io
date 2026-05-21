import json
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
FRAME_W = 96
FRAME_H = 128
COLS = 6
ROWS = 4
MAX_SUBJECT_W = 90
MAX_SUBJECT_H = 124
ALPHA_THRESHOLD = 16
ROW_TOP_OVERLAP = 40
ROW_BOTTOM_OVERLAP = 28
ROWS_META = {"down": 0, "left": 1, "right": 2, "up": 3}

CONFIGS = {
    "move": {
        "source": ROOT / "assets" / "runs" / "party-movement" / "rowan-templar" / "rowan-move-generated-source.png",
        "out": ROOT / "assets" / "actors" / "party" / "rowan-move.png",
        "run_root": ROOT / "assets" / "runs" / "party-movement" / "rowan-templar",
        "animation_name": "run-4dir-tall",
        "fps": 6,
    },
    "idle": {
        "source": ROOT / "assets" / "runs" / "party-idle" / "rowan-templar" / "rowan-idle-generated-source.png",
        "out": ROOT / "assets" / "actors" / "party" / "rowan-idle.png",
        "run_root": ROOT / "assets" / "runs" / "party-idle" / "rowan-templar",
        "animation_name": "idle-4dir-tall",
        "fps": 4,
    },
    "profile": {
        "source": ROOT / "assets" / "runs" / "party-profile" / "rowan-templar" / "rowan-profile-generated-source.png",
        "out": ROOT / "assets" / "actors" / "profiles" / "rowan_profile.png",
        "run_root": ROOT / "assets" / "runs" / "party-profile" / "rowan-templar",
    },
}


def remove_green_chroma(image):
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            green_delta = min(g - r, g - b)
            if (
                (g >= r + 2 and g >= b + 6) or
                (g >= 55 and g > r * 1.18 and g > b * 1.18) or
                (g >= 35 and green_delta >= 12) or
                (a < 180 and g >= 30 and g >= r + 5 and g >= b + 14)
            ):
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def edge_alpha_pixels(image):
    alpha = image.getchannel("A")
    count = 0
    for x in range(image.width):
        if alpha.getpixel((x, 0)):
            count += 1
        if alpha.getpixel((x, image.height - 1)):
            count += 1
    for y in range(image.height):
        if alpha.getpixel((0, y)):
            count += 1
        if alpha.getpixel((image.width - 1, y)):
            count += 1
    return count


def connected_components(image):
    alpha = image.getchannel("A")
    width, height = alpha.size
    pixels = alpha.load()
    visited = bytearray(width * height)
    components = []
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if visited[index] or pixels[x, y] <= ALPHA_THRESHOLD:
                continue
            queue = deque([(x, y)])
            visited[index] = 1
            area = 0
            min_x = max_x = x
            min_y = max_y = y
            while queue:
                cx, cy = queue.popleft()
                area += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    nindex = ny * width + nx
                    if visited[nindex] or pixels[nx, ny] <= ALPHA_THRESHOLD:
                        continue
                    visited[nindex] = 1
                    queue.append((nx, ny))
            if area >= 24:
                components.append({"area": area, "box": (min_x, min_y, max_x + 1, max_y + 1)})
    components.sort(key=lambda component: component["area"], reverse=True)
    return components


def expanded_intersects(a, b, padding):
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    return not (
        ax1 + padding < bx0 or
        bx1 + padding < ax0 or
        ay1 + padding < by0 or
        by1 + padding < ay0
    )


def subject_from_slot(slot, expected_y):
    components = connected_components(slot)
    if not components:
        return None, None
    row_candidates = [
        component for component in components
        if abs(((component["box"][1] + component["box"][3]) / 2) - expected_y) <= 132
    ]
    main = max(row_candidates or components, key=lambda component: component["area"])
    main_box = main["box"]
    main_center_y = (main_box[1] + main_box[3]) / 2
    selected = [
        component for component in components
        if expanded_intersects(main_box, component["box"], 34)
        and abs(((component["box"][1] + component["box"][3]) / 2) - main_center_y) <= 135
    ]
    left = min(component["box"][0] for component in selected)
    top = min(component["box"][1] for component in selected)
    right = max(component["box"][2] for component in selected)
    bottom = max(component["box"][3] for component in selected)
    box = (left, top, right, bottom)
    return slot.crop(box), box


def normalize_cell(cell):
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    if cell.width <= 0 or cell.height <= 0:
        return frame, None
    scale = min(MAX_SUBJECT_W / cell.width, MAX_SUBJECT_H / cell.height)
    resized = cell.resize(
        (max(1, round(cell.width * scale)), max(1, round(cell.height * scale))),
        Image.Resampling.LANCZOS,
    )
    paste_x = (FRAME_W - resized.width) // 2
    paste_y = FRAME_H - resized.height - 2
    frame.alpha_composite(resized, (paste_x, paste_y))
    frame = remove_green_chroma(frame)
    visible = frame.getchannel("A").getbbox()
    if not visible:
        return frame, None
    return frame, {
        "visible_box": {"x": visible[0], "y": visible[1], "w": visible[2] - visible[0], "h": visible[3] - visible[1]},
        "runtime_box": {"x": paste_x, "y": paste_y, "w": resized.width, "h": resized.height},
        "edge_alpha_pixels": edge_alpha_pixels(frame),
    }


def process_sheet(mode, config):
    source_path = config["source"]
    out_path = config["out"]
    run_root = config["run_root"]
    source = remove_green_chroma(Image.open(source_path))
    sheet = Image.new("RGBA", (FRAME_W * COLS, FRAME_H * ROWS), (0, 0, 0, 0))
    frames = []
    source_cell_w = source.width / COLS
    source_cell_h = source.height / ROWS
    for row in range(ROWS):
        row_top = round(row * source_cell_h)
        row_bottom = round((row + 1) * source_cell_h)
        for col in range(COLS):
            cell_left = round(col * source_cell_w)
            cell_right = round((col + 1) * source_cell_w)
            cell_top = max(0, row_top - (ROW_TOP_OVERLAP if row else 0))
            cell_bottom = min(source.height, row_bottom + ROW_BOTTOM_OVERLAP)
            slot = source.crop((cell_left, cell_top, cell_right, cell_bottom))
            expected_y = ((row_top + row_bottom) / 2) - cell_top
            subject, subject_box = subject_from_slot(slot, expected_y)
            if subject is None:
                raise ValueError(f"Rowan Templar {mode} frame row={row} col={col} is empty")
            frame, report = normalize_cell(subject)
            if report is None:
                raise ValueError(f"Rowan Templar {mode} frame row={row} col={col} is empty")
            report["row"] = row
            report["col"] = col
            report["source_box"] = {
                "x": cell_left + subject_box[0],
                "y": cell_top + subject_box[1],
                "w": subject_box[2] - subject_box[0],
                "h": subject_box[3] - subject_box[1],
            }
            report["source_cell"] = {
                "x": cell_left,
                "y": cell_top,
                "w": cell_right - cell_left,
                "h": cell_bottom - cell_top,
            }
            sheet.alpha_composite(frame, (col * FRAME_W, row * FRAME_H))
            frames.append(report)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    run_root.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)
    validation = {
        "source": source_path.relative_to(ROOT).as_posix(),
        "output": out_path.relative_to(ROOT).as_posix(),
        "mode": mode,
        "animation": {"name": config["animation_name"], "fps": config["fps"]},
        "source_size": {"width": source.width, "height": source.height},
        "runtime_size": {"width": sheet.width, "height": sheet.height},
        "frame_size": {"width": FRAME_W, "height": FRAME_H},
        "frames_per_row": COLS,
        "rows": ROWS_META,
        "edge_alpha_pixels": edge_alpha_pixels(sheet),
        "frames": frames,
    }
    bad = [frame for frame in frames if frame["edge_alpha_pixels"]]
    if validation["edge_alpha_pixels"] or bad:
        raise SystemExit(json.dumps({"error": "edge alpha", **validation}, indent=2))
    (run_root / "validation.json").write_text(json.dumps(validation, indent=2), encoding="utf-8")
    return {"ok": True, "output": validation["output"], "runtime_size": validation["runtime_size"]}


def process_profile(config):
    source_path = config["source"]
    out_path = config["out"]
    run_root = config["run_root"]
    source = Image.open(source_path).convert("RGB")
    output = ImageOps.fit(source, (1672, 941), Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    run_root.mkdir(parents=True, exist_ok=True)
    output.save(out_path)
    validation = {
        "source": source_path.relative_to(ROOT).as_posix(),
        "output": out_path.relative_to(ROOT).as_posix(),
        "mode": "profile",
        "source_size": {"width": source.width, "height": source.height},
        "runtime_size": {"width": output.width, "height": output.height},
    }
    (run_root / "validation.json").write_text(json.dumps(validation, indent=2), encoding="utf-8")
    return {"ok": True, "output": validation["output"], "runtime_size": validation["runtime_size"]}


def main(mode="all"):
    modes = ["move", "idle", "profile"] if mode == "all" else [mode]
    results = []
    for item in modes:
        if item not in CONFIGS:
            raise SystemExit(f"Unknown mode {item!r}. Use one of: all, {', '.join(CONFIGS)}")
        if item == "profile":
            results.append(process_profile(CONFIGS[item]))
        else:
            results.append(process_sheet(item, CONFIGS[item]))
    print(json.dumps(results if len(results) > 1 else results[0], indent=2))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "all")
