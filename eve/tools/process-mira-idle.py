import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT / "assets" / "runs" / "tutorial-npc-mira"
SOURCE = RUN_ROOT / "source.png"
OUT = ROOT / "assets" / "npcs" / "tutorial" / "mira-idle.png"
VALIDATION = RUN_ROOT / "validation.json"

FRAME_COUNT = 4
FRAME_W = 64
FRAME_H = 64
TARGET_W = 44
TARGET_H = 61


def remove_chroma(image):
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if g >= 170 and r <= 90 and b <= 90:
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


def main():
    source = remove_chroma(Image.open(SOURCE))
    runtime = Image.new("RGBA", (FRAME_W * FRAME_COUNT, FRAME_H), (0, 0, 0, 0))
    report = {
        "source": "source.png",
        "runtime": "eve/assets/npcs/tutorial/mira-idle.png",
        "frame_count": FRAME_COUNT,
        "runtime_size": {"width": FRAME_W * FRAME_COUNT, "height": FRAME_H},
        "frame_size": {"width": FRAME_W, "height": FRAME_H},
        "target_figure_size": {"width": TARGET_W, "height": TARGET_H},
        "frames": [],
    }

    slice_w = source.width // FRAME_COUNT
    for index in range(FRAME_COUNT):
        left = index * slice_w
        right = source.width if index == FRAME_COUNT - 1 else (index + 1) * slice_w
        source_frame = source.crop((left, 0, right, source.height))
        bbox = source_frame.getchannel("A").getbbox()
        if not bbox:
            raise ValueError(f"Frame {index} is empty")
        crop = source_frame.crop(bbox)
        resized = crop.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        paste_x = (FRAME_W - TARGET_W) // 2
        paste_y = 1
        frame.alpha_composite(resized, (paste_x, paste_y))
        runtime.alpha_composite(frame, (index * FRAME_W, 0))
        report["frames"].append({
            "source_box": {"x": bbox[0] + left, "y": bbox[1], "w": bbox[2] - bbox[0], "h": bbox[3] - bbox[1]},
            "runtime_box": {"x": paste_x, "y": paste_y, "w": TARGET_W, "h": TARGET_H},
            "edge_alpha_pixels": edge_alpha_pixels(frame),
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    runtime.save(OUT)
    report["edge_alpha_pixels"] = edge_alpha_pixels(runtime)
    VALIDATION.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
