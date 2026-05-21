from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

from sprite_utils import load_request, rows_by_index, utc_now, write_json


def count_alpha(image: Image.Image) -> int:
    alpha = image.convert("RGBA").getchannel("A")
    return sum(1 for value in alpha.getdata() if value > 0)


def validate(run_dir: Path, sheet_name: str) -> dict:
    request = load_request(run_dir)
    atlas = request["atlas"]
    path = run_dir / "final" / sheet_name
    errors: list[str] = []
    warnings: list[str] = []
    cells: list[dict] = []

    if not path.exists():
        errors.append(f"Missing spritesheet: {path}")
        report = {
            "ok": False,
            "created_at": utc_now(),
            "file": str(path.resolve()),
            "errors": errors,
            "warnings": warnings,
            "cells": cells,
        }
        write_json(run_dir / "final/validation.json", report)
        return report

    used_by_row = {row["row"]: row for row in rows_by_index(request)}
    with Image.open(path) as image:
        image = image.convert("RGBA")
        if image.width != atlas["width"] or image.height != atlas["height"]:
            errors.append(
                f"Expected {atlas['width']}x{atlas['height']}, got {image.width}x{image.height}"
            )
        for row_index in range(atlas["rows"]):
            row = used_by_row.get(row_index)
            for column in range(atlas["columns"]):
                cell = image.crop(
                    (
                        column * atlas["cell_width"],
                        row_index * atlas["cell_height"],
                        (column + 1) * atlas["cell_width"],
                        (row_index + 1) * atlas["cell_height"],
                    )
                )
                nontransparent = count_alpha(cell)
                used = row is not None and column < row["frames"]
                state = row["state"] if row else None
                cells.append(
                    {
                        "state": state,
                        "row": row_index,
                        "column": column,
                        "used": used,
                        "nontransparent_pixels": nontransparent,
                    }
                )
                if used and nontransparent == 0:
                    errors.append(f"Used cell is empty: row {row_index} column {column}")
                if not used and nontransparent != 0:
                    errors.append(
                        f"Unused cell is not transparent: row {row_index} column {column}"
                    )

        report = {
            "ok": len(errors) == 0,
            "created_at": utc_now(),
            "file": str(path.resolve()),
            "format": Image.open(path).format,
            "mode": image.mode,
            "width": image.width,
            "height": image.height,
            "errors": errors,
            "warnings": warnings,
            "cells": cells,
        }

    write_json(run_dir / "final/validation.json", report)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate final sprite atlas contract.")
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--sheet-name", default="spritesheet.webp")
    args = parser.parse_args()
    report = validate(args.run_dir, args.sheet_name)
    print(f"Validation ok={report['ok']} errors={len(report['errors'])} warnings={len(report['warnings'])}")


if __name__ == "__main__":
    main()
