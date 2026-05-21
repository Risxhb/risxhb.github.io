from __future__ import annotations

import argparse
from pathlib import Path
from types import SimpleNamespace

from PIL import Image, ImageDraw

from build_spritesheet import build_spritesheet
from create_contact_sheet import create_contact_sheet
from extract_frames import extract_frames
from scaffold_run import render_request, write_jobs, write_prompts
from sprite_utils import DEFAULT_STYLE_CONTRACT, ensure_run_dirs, write_json
from validate_spritesheet import validate


ROOT = Path(__file__).resolve().parents[1]


def draw_synthetic_outputs(run_dir: Path, request: dict) -> None:
    decoded_dir = run_dir / "decoded"
    references_dir = run_dir / "references"
    decoded_dir.mkdir(parents=True, exist_ok=True)
    references_dir.mkdir(parents=True, exist_ok=True)

    base = Image.new("RGB", (384, 416), (255, 0, 255))
    draw = ImageDraw.Draw(base)
    draw.ellipse([126, 58, 258, 190], fill=(240, 240, 248), outline=(30, 30, 36), width=5)
    draw.rectangle([150, 184, 234, 330], fill=(70, 96, 120), outline=(30, 30, 36), width=5)
    draw.ellipse([165, 108, 178, 122], fill=(20, 20, 24))
    draw.ellipse([206, 108, 219, 122], fill=(20, 20, 24))
    base.save(decoded_dir / "base.png")
    base.save(references_dir / "canonical-base.png")

    for row in request["rows"]:
        frames = row["frames"]
        slot_w = 360
        height = 260
        strip = Image.new("RGB", (slot_w * frames, height), (255, 0, 255))
        draw = ImageDraw.Draw(strip)
        for index in range(frames):
            x = index * slot_w + slot_w // 2
            bob = (index % 3 - 1) * 7
            if row["state"] == "jumping":
                bob = -abs(index - frames // 2) * 10
            if row["state"] == "failed":
                bob = min(index, 4) * 9
            body = [x - 48, 92 + bob, x + 48, 202 + bob]
            head = [x - 58, 30 + bob, x + 58, 132 + bob]
            draw.ellipse(head, fill=(238, 242, 248), outline=(25, 25, 30), width=5)
            draw.rounded_rectangle(body, radius=12, fill=(78, 110, 134), outline=(25, 25, 30), width=5)
            draw.ellipse([x - 26, 72 + bob, x - 14, 84 + bob], fill=(15, 15, 18))
            draw.ellipse([x + 14, 72 + bob, x + 26, 84 + bob], fill=(15, 15, 18))
            arm_y = 144 + bob
            if row["state"] == "waving" and index in (1, 2):
                draw.line([x + 44, arm_y, x + 80, arm_y - 50], fill=(25, 25, 30), width=8)
            else:
                draw.line([x + 44, arm_y, x + 78, arm_y + 22], fill=(25, 25, 30), width=8)
            direction = 1 if "right" in row["state"] else -1 if "left" in row["state"] else 0
            leg_shift = direction * ((index % 4) - 1) * 8
            draw.line([x - 24, 202 + bob, x - 42 - leg_shift, 232 + bob], fill=(25, 25, 30), width=8)
            draw.line([x + 24, 202 + bob, x + 42 + leg_shift, 232 + bob], fill=(25, 25, 30), width=8)
        strip.save(decoded_dir / f"{row['state']}.png")


def run_smoke(run_dir: Path) -> dict:
    args = SimpleNamespace(
        sprite_set_id="smoke-sprite",
        display_name="Smoke Sprite",
        description="Synthetic smoke test sprite scaffold.",
        subject_notes="A simple centered test subject for verifying the sprite production pipeline.",
        style_contract=DEFAULT_STYLE_CONTRACT,
    )
    run_dir.mkdir(parents=True, exist_ok=True)
    ensure_run_dirs(run_dir)
    request = render_request(args, run_dir)
    write_json(run_dir / "sprite_request.json", request)
    write_prompts(run_dir, request)
    write_jobs(run_dir, request)

    from generate_layout_guides import create_layout_guides

    create_layout_guides(run_dir, request)
    draw_synthetic_outputs(run_dir, request)
    frame_manifest = extract_frames(run_dir, threshold=96, source_mode="slot-fit")
    build_spritesheet(run_dir)
    validation = validate(run_dir, "spritesheet.webp")
    review = create_contact_sheet(run_dir)
    return {
        "frame_manifest_ok": frame_manifest["ok"],
        "validation_ok": validation["ok"],
        "review_ok": review["ok"],
        "run_dir": str(run_dir.resolve()),
        "errors": frame_manifest["errors"] + validation["errors"],
        "warnings": frame_manifest["warnings"] + validation["warnings"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a synthetic sprite pipeline smoke test.")
    parser.add_argument("--run-dir", type=Path, default=ROOT / ".tmp/smoke-sprite-run")
    args = parser.parse_args()
    result = run_smoke(args.run_dir)
    print(result)
    if not (result["frame_manifest_ok"] and result["validation_ok"] and result["review_ok"]):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
