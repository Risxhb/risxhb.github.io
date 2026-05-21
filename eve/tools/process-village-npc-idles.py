import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT / "assets" / "runs" / "village-npc-idles"
SOURCE = RUN_ROOT / "source.png"
OUT_DIR = ROOT / "assets" / "npcs" / "village"
VALIDATION = RUN_ROOT / "validation.json"

SPECS = [
    ("gate_guard", "gate-guard-idle.png"),
    ("supply_clerk", "supply-clerk-idle.png"),
    ("rumor_merchant", "rumor-merchant-idle.png"),
]

FRAME_COUNT = 4
FRAME_W = 96
FRAME_H = 128
TARGET_W = 74
TARGET_H = 124


def remove_chroma(image):
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            key_distance = abs(r - 255) + g + abs(b - 255)
            if key_distance <= 135:
                pixels[x, y] = (0, 0, 0, 0)
            elif key_distance <= 260:
                alpha = int(a * (key_distance - 135) / 125)
                pixels[x, y] = (r, g, b, alpha)
            elif r >= 150 and b >= 150 and g <= 130:
                pixels[x, y] = (min(r, g + 92), g, min(b, g + 92), a)
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


def main():
    source = remove_chroma(Image.open(SOURCE))
    row_h = source.height // len(SPECS)
    col_w = source.width // FRAME_COUNT
    report = {
        "source": "source.png",
        "frame_count": FRAME_COUNT,
        "runtime_frame_size": {"width": FRAME_W, "height": FRAME_H},
        "target_figure_size": {"width": TARGET_W, "height": TARGET_H},
        "sprites": {}
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for row, (npc_id, filename) in enumerate(SPECS):
      runtime = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H), (0, 0, 0, 0))
      frames = []
      top = row * row_h
      bottom = source.height if row == len(SPECS) - 1 else (row + 1) * row_h
      for index in range(FRAME_COUNT):
          left = index * col_w
          right = source.width if index == FRAME_COUNT - 1 else (index + 1) * col_w
          source_frame = source.crop((left, top, right, bottom))
          bbox = source_frame.getchannel("A").getbbox()
          if not bbox:
              raise ValueError(f"{npc_id} frame {index} is empty")
          crop = source_frame.crop(bbox)
          resized = crop.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
          frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
          paste_x = (FRAME_W - TARGET_W) // 2
          paste_y = FRAME_H - TARGET_H - 2
          frame.alpha_composite(resized, (paste_x, paste_y))
          runtime.alpha_composite(frame, (index * FRAME_W, 0))
          frames.append({
              "source_box": {"x": bbox[0] + left, "y": bbox[1] + top, "w": bbox[2] - bbox[0], "h": bbox[3] - bbox[1]},
              "runtime_box": {"x": paste_x, "y": paste_y, "w": TARGET_W, "h": TARGET_H},
              "edge_alpha_pixels": edge_alpha_pixels(frame)
          })

      out_path = OUT_DIR / filename
      runtime.save(out_path)
      report["sprites"][npc_id] = {
          "runtime": f"eve/assets/npcs/village/{filename}",
          "runtime_size": {"width": FRAME_W * FRAME_COUNT, "height": FRAME_H},
          "frames": frames,
          "edge_alpha_pixels": edge_alpha_pixels(runtime)
      }

    VALIDATION.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {len(SPECS)} village NPC idle sheets")


if __name__ == "__main__":
    main()
