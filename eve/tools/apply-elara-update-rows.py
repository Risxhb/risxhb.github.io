import importlib.util
import argparse
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PROCESSOR_PATH = ROOT / "tools" / "process-elara-tall-move.py"
MANIFEST_PATH = ROOT / "data" / "asset_manifest.json"
ASSET_ID = "actor.elara.move"
OUT_PATH = ROOT / "assets" / "actors" / "party" / "elara-move.png"
RUN_ROOT = ROOT / "assets" / "runs" / "party-movement" / "elara-tall"
VALIDATION_PATH = RUN_ROOT / "validation.json"
ROWS = {
    "down": ROOT / "assets" / "actors" / "update" / "elara_down.png",
    "left": ROOT / "assets" / "actors" / "update" / "elara_left.png",
    "right": ROOT / "assets" / "actors" / "update" / "elara_right.png",
    "up": ROOT / "assets" / "actors" / "update" / "elara_up.png",
}


def load_manifest():
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def load_processor():
    spec = importlib.util.spec_from_file_location("elara_tall_processor", PROCESSOR_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def frame_count_from_manifest(manifest):
    frames = manifest["images"][ASSET_ID]["animation"]["frames"]
    if not isinstance(frames, int):
        raise ValueError(f"{ASSET_ID} animation.frames must be an integer")
    return frames


def normalized_report(processor, direction, source_path, source_box, source_cell, subject, col):
    frame, report = processor.normalize_cell(subject)
    if report is None:
        raise ValueError(f"{source_path.name} frame {col} is empty")
    report["direction"] = direction
    report["row"] = processor.ROWS_META[direction]
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


def report_for_frame(processor, frame, row_index, col, source):
    visible = frame.getchannel("A").getbbox()
    if not visible:
        raise ValueError(f"Copied Elara frame row={row_index} col={col} is empty")
    return {
        "row": row_index,
        "col": col,
        "source": source,
        "visible_box": {"x": visible[0], "y": visible[1], "w": visible[2] - visible[0], "h": visible[3] - visible[1]},
        "runtime_box": {"x": visible[0], "y": visible[1], "w": visible[2] - visible[0], "h": visible[3] - visible[1]},
        "edge_alpha_pixels": processor.edge_alpha_pixels(frame),
    }


def copy_existing_row(source_sheet, processor, row_index, source_frames, target_frames):
    row = Image.new("RGBA", (processor.FRAME_W * target_frames, processor.FRAME_H), (0, 0, 0, 0))
    reports = []
    for col in range(target_frames):
        source_col = min(col, source_frames - 1)
        cell = source_sheet.crop((
            source_col * processor.FRAME_W,
            row_index * processor.FRAME_H,
            (source_col + 1) * processor.FRAME_W,
            (row_index + 1) * processor.FRAME_H,
        ))
        row.alpha_composite(cell, (col * processor.FRAME_W, 0))
        reports.append(report_for_frame(processor, cell, row_index, col, OUT_PATH.relative_to(ROOT).as_posix()))
    return row, reports


def parse_args():
    parser = argparse.ArgumentParser(description="Apply update Elara movement rows to the runtime spritesheet.")
    parser.add_argument(
        "--frames",
        type=int,
        choices=range(4, 9),
        metavar="4-8",
        help="Target frame count for each movement row. Defaults to actor.elara.move metadata.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    processor = load_processor()
    manifest = load_manifest()
    source_frames = frame_count_from_manifest(manifest)
    target_frames = args.frames if args.frames is not None else source_frames
    source_sheet = Image.open(OUT_PATH).convert("RGBA")
    expected_size = (processor.FRAME_W * source_frames, processor.FRAME_H * processor.ROWS)
    if source_sheet.size != expected_size:
        raise ValueError(f"Expected {OUT_PATH} to be {expected_size}, found {source_sheet.size}")

    sheet = Image.new("RGBA", (processor.FRAME_W * target_frames, processor.FRAME_H * processor.ROWS), (0, 0, 0, 0))
    replaced_rows = {processor.ROWS_META[direction] for direction in ROWS}
    all_reports = []
    for row_index in range(processor.ROWS):
        if row_index in replaced_rows:
            continue
        row, reports = copy_existing_row(source_sheet, processor, row_index, source_frames, target_frames)
        sheet.alpha_composite(row, (0, row_index * processor.FRAME_H))
        all_reports.extend(reports)

    for direction, source_path in ROWS.items():
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        row_index = processor.ROWS_META[direction]
        row_y = row_index * processor.FRAME_H
        for col, (frame, report) in enumerate(process_row(processor, direction, source_path, target_frames)):
            sheet.alpha_composite(frame, (col * processor.FRAME_W, row_y))
            all_reports.append(report)

    edge_alpha = processor.edge_alpha_pixels(sheet)
    if edge_alpha:
        raise ValueError(f"Updated Elara move sheet has {edge_alpha} edge alpha pixels")

    sheet.save(OUT_PATH)
    asset = manifest["images"][ASSET_ID]
    asset["width"] = sheet.width
    asset["height"] = sheet.height
    asset["animation"]["frames"] = target_frames
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    validation = {}
    if VALIDATION_PATH.exists():
        validation = json.loads(VALIDATION_PATH.read_text(encoding="utf-8"))
    validation["output"] = OUT_PATH.relative_to(ROOT).as_posix()
    validation["runtime_size"] = {"width": sheet.width, "height": sheet.height}
    validation["frame_size"] = {"width": processor.FRAME_W, "height": processor.FRAME_H}
    validation["frames_per_row"] = target_frames
    validation["rows"] = processor.ROWS_META
    validation["edge_alpha_pixels"] = edge_alpha
    validation["row_replacements"] = {
        direction: source_path.relative_to(ROOT).as_posix()
        for direction, source_path in ROWS.items()
    }
    validation["frames"] = sorted(all_reports, key=lambda frame: (frame["row"], frame["col"]))
    VALIDATION_PATH.write_text(json.dumps(validation, indent=2), encoding="utf-8")

    print(json.dumps({
        "ok": True,
        "output": OUT_PATH.relative_to(ROOT).as_posix(),
        "replaced_rows": sorted(ROWS),
        "runtime_size": validation["runtime_size"],
        "frames": target_frames,
    }, indent=2))


if __name__ == "__main__":
    main()
