import argparse
import importlib.util
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PROCESSOR_PATH = ROOT / "tools" / "process-elara-tall-move.py"
MANIFEST_PATH = ROOT / "data" / "asset_manifest.json"
RUN_ROOT = ROOT / "assets" / "runs"
ROWS_META = {"down": 0, "left": 1, "right": 2, "up": 3}
MODES = {
    "move": {
        "asset_id": "actor.nia.move",
        "out": ROOT / "assets" / "actors" / "party" / "nia-move.png",
        "run_root": RUN_ROOT / "party-movement" / "nia-tall",
        "sources": {
            "down": ROOT / "assets" / "actors" / "update" / "nia_down.png",
            "left": ROOT / "assets" / "actors" / "update" / "nia_left.png",
            "right": ROOT / "assets" / "actors" / "update" / "nia_right.png",
            "up": ROOT / "assets" / "actors" / "update" / "nia_up.png",
        },
        "animation_name": "run-4dir-tall",
        "fps": 6,
        "enforce_side_loop": True,
    },
    "idle": {
        "asset_id": "actor.nia.idle",
        "out": ROOT / "assets" / "actors" / "party" / "nia-idle.png",
        "run_root": RUN_ROOT / "party-idle" / "nia-tall",
        "sources": {
            "down": ROOT / "assets" / "actors" / "update" / "nia_idle_down.png",
            "left": ROOT / "assets" / "actors" / "update" / "nia_idle_left.png",
            "right": ROOT / "assets" / "actors" / "update" / "nia_idle_right.png",
            "up": ROOT / "assets" / "actors" / "update" / "nia_idle_up.png",
        },
        "animation_name": "idle-4dir-tall",
        "fps": 4,
        "enforce_side_loop": False,
    },
}


def load_processor():
    spec = importlib.util.spec_from_file_location("tall_processor", PROCESSOR_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_manifest():
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def normalized_report(processor, direction, source_path, source_box, source_cell, subject, col):
    frame, report = processor.normalize_cell(subject)
    if report is None:
        raise ValueError(f"{source_path.name} frame {col} is empty")
    report["direction"] = direction
    report["row"] = ROWS_META[direction]
    report["col"] = col
    report["source"] = source_path.relative_to(ROOT).as_posix()
    report["source_box"] = source_box
    report["source_cell"] = source_cell
    return frame, report


def process_row_by_subject_runs(processor, direction, source_path, source, frame_count):
    try:
        subjects = processor.find_subject_runs(source)
    except ValueError:
        return None
    if len(subjects) != frame_count:
        return None

    frames = []
    for col, subject in enumerate(subjects):
        source_box = subject["box"]
        frame, report = normalized_report(
            processor,
            direction,
            source_path,
            source_box,
            {
                "x": source_box["x"],
                "y": 0,
                "w": source_box["w"],
                "h": source.height,
                "method": "subject-runs",
            },
            subject["crop"],
            col,
        )
        report["crop_method"] = "subject-runs"
        frames.append((frame, report))
    return frames


def process_row_by_equal_slots(processor, direction, source_path, source, frame_count):
    frames = []
    source_cell_w = source.width / frame_count
    for col in range(frame_count):
        cell_left = round(col * source_cell_w)
        cell_right = round((col + 1) * source_cell_w)
        slot = source.crop((cell_left, 0, cell_right, source.height))
        subject, subject_box = processor.subject_from_slot(slot, source.height / 2)
        if subject is None:
            raise ValueError(f"{source_path.name} frame {col} is empty")
        source_box = {
            "x": cell_left + subject_box[0],
            "y": subject_box[1],
            "w": subject_box[2] - subject_box[0],
            "h": subject_box[3] - subject_box[1],
        }
        source_cell = {
            "x": cell_left,
            "y": 0,
            "w": cell_right - cell_left,
            "h": source.height,
            "method": "equal-slots",
        }
        frame, report = normalized_report(processor, direction, source_path, source_box, source_cell, subject, col)
        report["crop_method"] = "equal-slots"
        frames.append((frame, report))
    return frames


def process_row(processor, direction, source_path, frame_count):
    source = processor.remove_green_chroma(Image.open(source_path))
    frames = process_row_by_subject_runs(processor, direction, source_path, source, frame_count)
    if frames is not None:
        return frames
    return process_row_by_equal_slots(processor, direction, source_path, source, frame_count)


def report_for_frame(processor, direction, frame, col, source, crop_method):
    visible = frame.getchannel("A").getbbox()
    if not visible:
        raise ValueError(f"Nia {direction} frame {col} is empty after loop enforcement")
    return {
        "direction": direction,
        "row": ROWS_META[direction],
        "col": col,
        "source": source,
        "visible_box": {"x": visible[0], "y": visible[1], "w": visible[2] - visible[0], "h": visible[3] - visible[1]},
        "runtime_box": {"x": visible[0], "y": visible[1], "w": visible[2] - visible[0], "h": visible[3] - visible[1]},
        "edge_alpha_pixels": processor.edge_alpha_pixels(frame),
        "crop_method": crop_method,
        "side_loop_copy": True,
    }


def compile_mode(processor, manifest, mode, frame_count):
    config = MODES[mode]
    sheet = Image.new("RGBA", (processor.FRAME_W * frame_count, processor.FRAME_H * processor.ROWS), (0, 0, 0, 0))
    all_reports = []
    row_frames = {}

    for direction, source_path in config["sources"].items():
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        frames = process_row(processor, direction, source_path, frame_count)
        if config["enforce_side_loop"] and direction in {"left", "right"} and frame_count >= 6:
            frame_copy = frames[1][0].copy()
            source = f"{source_path.relative_to(ROOT).as_posix()}#frame2"
            method = frames[1][1].get("crop_method", "copied-frame")
            report_copy = report_for_frame(processor, direction, frame_copy, 5, source, method)
            frames[5] = (frame_copy, report_copy)
        row_frames[direction] = frames

    for direction, frames in row_frames.items():
        row_y = ROWS_META[direction] * processor.FRAME_H
        for col, (frame, report) in enumerate(frames):
            sheet.alpha_composite(frame, (col * processor.FRAME_W, row_y))
            all_reports.append(report)

    edge_alpha = processor.edge_alpha_pixels(sheet)
    if edge_alpha:
        raise ValueError(f"Updated Nia {mode} sheet has {edge_alpha} edge alpha pixels")

    out_path = config["out"]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)

    images = manifest.setdefault("images", {})
    images[config["asset_id"]] = {
        "kind": "spritesheet",
        "path": out_path.relative_to(ROOT).as_posix(),
        "width": sheet.width,
        "height": sheet.height,
        "source_run": config["run_root"].relative_to(ROOT).as_posix(),
        "edge_alpha_pixels": edge_alpha,
        "animation": {
            "name": config["animation_name"],
            "frame_width": processor.FRAME_W,
            "frame_height": processor.FRAME_H,
            "frames": frame_count,
            "fps": config["fps"],
            "rows": ROWS_META,
        },
    }

    config["run_root"].mkdir(parents=True, exist_ok=True)
    validation = {
        "output": out_path.relative_to(ROOT).as_posix(),
        "mode": mode,
        "runtime_size": {"width": sheet.width, "height": sheet.height},
        "frame_size": {"width": processor.FRAME_W, "height": processor.FRAME_H},
        "frames_per_row": frame_count,
        "rows": ROWS_META,
        "edge_alpha_pixels": edge_alpha,
        "row_replacements": {
            direction: source_path.relative_to(ROOT).as_posix()
            for direction, source_path in config["sources"].items()
        },
        "frames": sorted(all_reports, key=lambda frame: (frame["row"], frame["col"])),
    }
    (config["run_root"] / "validation.json").write_text(json.dumps(validation, indent=2), encoding="utf-8")
    return {
        "mode": mode,
        "output": out_path.relative_to(ROOT).as_posix(),
        "runtime_size": validation["runtime_size"],
        "frames": frame_count,
    }


def parse_args():
    parser = argparse.ArgumentParser(description="Apply Nia tall movement and idle update rows.")
    parser.add_argument("--mode", choices=("move", "idle", "all"), default="all")
    parser.add_argument("--frames", type=int, choices=range(4, 9), default=6, metavar="4-8")
    return parser.parse_args()


def main():
    args = parse_args()
    processor = load_processor()
    manifest = load_manifest()
    modes = ("move", "idle") if args.mode == "all" else (args.mode,)
    reports = [compile_mode(processor, manifest, mode, args.frames) for mode in modes]
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "processed": reports}, indent=2))


if __name__ == "__main__":
    main()
