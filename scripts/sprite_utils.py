from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_STYLE_CONTRACT = (
    "Codex digital pet sprite style: pixel-art-adjacent low-resolution mascot sprite, "
    "compact chibi proportions, chunky whole-body silhouette, thick dark 1-2 px outline, "
    "visible stepped/pixel edges, limited palette, flat cel shading with at most one small "
    "highlight and one shadow step, simple readable face, tiny limbs, and no detail that "
    "disappears at 192x208."
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def load_request(run_dir: Path) -> dict[str, Any]:
    path = run_dir / "sprite_request.json"
    if not path.exists():
        raise FileNotFoundError(f"Missing sprite request: {path}")
    request = load_json(path)
    atlas = request["atlas"]
    expected_width = atlas["columns"] * atlas["cell_width"]
    expected_height = atlas["rows"] * atlas["cell_height"]
    if atlas.get("width") != expected_width or atlas.get("height") != expected_height:
        raise ValueError(
            "Atlas width/height must equal columns*cell_width and rows*cell_height"
        )
    return request


def rows_by_index(request: dict[str, Any]) -> list[dict[str, Any]]:
    rows = sorted(request["rows"], key=lambda item: item["row"])
    seen: set[int] = set()
    for row in rows:
        row_index = row["row"]
        if row_index in seen:
            raise ValueError(f"Duplicate row index {row_index}")
        seen.add(row_index)
    return rows


def parse_hex_color(hex_color: str) -> tuple[int, int, int]:
    value = hex_color.strip().lstrip("#")
    if len(value) != 6:
        raise ValueError(f"Expected 6-digit hex color, got {hex_color!r}")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def chroma_rgb(request: dict[str, Any]) -> tuple[int, int, int]:
    chroma = request.get("chroma_key", {})
    if "rgb" in chroma:
        return tuple(chroma["rgb"])
    return parse_hex_color(chroma.get("hex", "#FF00FF"))


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_metadata(path: Path) -> dict[str, Any]:
    from PIL import Image

    with Image.open(path) as image:
        return {
            "width": image.width,
            "height": image.height,
            "mode": image.mode,
            "format": image.format,
        }


def ensure_run_dirs(run_dir: Path) -> None:
    for relative in [
        "prompts/rows",
        "references/layout-guides",
        "decoded",
        "frames",
        "qa",
        "final",
    ]:
        (run_dir / relative).mkdir(parents=True, exist_ok=True)


def render_template(text: str, values: dict[str, Any]) -> str:
    rendered = text
    for key, value in values.items():
        if isinstance(value, list):
            value = ", ".join(str(item) for item in value)
        rendered = rendered.replace("{{" + key + "}}", str(value))
    return rendered


def render_json_template(text: str, values: dict[str, Any]) -> str:
    escaped: dict[str, Any] = {}
    for key, value in values.items():
        if isinstance(value, str):
            escaped[key] = json.dumps(value)[1:-1]
        else:
            escaped[key] = value
    return render_template(text, escaped)
