import json
from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT / "assets" / "runs" / "title-menu"
SOURCE = RUN_ROOT / "source.png"
OUT_DIR = ROOT / "assets" / "ui"
MANIFEST = ROOT / "data" / "asset_manifest.json"
VALIDATION = RUN_ROOT / "validation.json"


def remove_magenta(image):
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if r >= 160 and g <= 130 and b >= 120:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def component_boxes(image):
    alpha = image.getchannel("A")
    visited = set()
    boxes = []
    for y in range(image.height):
        for x in range(image.width):
            if (x, y) in visited or alpha.getpixel((x, y)) == 0:
                continue
            queue = deque([(x, y)])
            visited.add((x, y))
            min_x = max_x = x
            min_y = max_y = y
            area = 0
            while queue:
                cx, cy = queue.popleft()
                area += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= image.width or ny >= image.height:
                        continue
                    if (nx, ny) in visited or alpha.getpixel((nx, ny)) == 0:
                        continue
                    visited.add((nx, ny))
                    queue.append((nx, ny))
            if area > 500:
                boxes.append((min_x, min_y, max_x + 1, max_y + 1, area))
    return sorted(boxes, key=lambda box: box[4], reverse=True)


def pad_crop(image, box, padding=4):
    x1, y1, x2, y2, _ = box
    x1 = max(0, x1 - padding)
    y1 = max(0, y1 - padding)
    x2 = min(image.width, x2 + padding)
    y2 = min(image.height, y2 + padding)
    return image.crop((x1, y1, x2, y2)), (x1, y1, x2, y2)


def edge_alpha_pixels(image):
    alpha = image.getchannel("A")
    count = 0
    for x in range(image.width):
        count += 1 if alpha.getpixel((x, 0)) else 0
        count += 1 if alpha.getpixel((x, image.height - 1)) else 0
    for y in range(image.height):
        count += 1 if alpha.getpixel((0, y)) else 0
        count += 1 if alpha.getpixel((image.width - 1, y)) else 0
    return count


def update_manifest(entries):
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    images = manifest.setdefault("images", {})
    for asset_id, path, image in entries:
      images[asset_id] = {
          "kind": "standalone",
          "path": path.as_posix(),
          "width": image.width,
          "height": image.height,
          "source_run": "assets/runs/title-menu",
          "edge_alpha_pixels": edge_alpha_pixels(image)
      }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def main():
    keyed = remove_magenta(Image.open(SOURCE))
    boxes = component_boxes(keyed)
    if len(boxes) < 2:
        raise ValueError(f"Expected at least two UI components, found {len(boxes)}")
    panel_box = max(boxes, key=lambda box: (box[2] - box[0]) * (box[3] - box[1]))
    highlight_box = max((box for box in boxes if box != panel_box), key=lambda box: box[2] - box[0])

    panel, panel_crop = pad_crop(keyed, panel_box, 8)
    highlight, highlight_crop = pad_crop(keyed, highlight_box, 8)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    panel_path = OUT_DIR / "title-panel.png"
    highlight_path = OUT_DIR / "title-highlight.png"
    panel.save(panel_path)
    highlight.save(highlight_path)

    update_manifest([
        ("ui.title.panel", Path("assets/ui/title-panel.png"), panel),
        ("ui.title.highlight", Path("assets/ui/title-highlight.png"), highlight)
    ])

    report = {
        "source": "assets/runs/title-menu/source.png",
        "assets": [
            {"id": "ui.title.panel", "path": "assets/ui/title-panel.png", "crop": panel_crop, "size": [panel.width, panel.height], "edge_alpha_pixels": edge_alpha_pixels(panel)},
            {"id": "ui.title.highlight", "path": "assets/ui/title-highlight.png", "crop": highlight_crop, "size": [highlight.width, highlight.height], "edge_alpha_pixels": edge_alpha_pixels(highlight)}
        ]
    }
    VALIDATION.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {panel_path.relative_to(ROOT)} and {highlight_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
