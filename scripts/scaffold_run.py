from __future__ import annotations

import argparse
import json
from pathlib import Path

from generate_layout_guides import create_layout_guides
from sprite_utils import (
    DEFAULT_STYLE_CONTRACT,
    ensure_run_dirs,
    render_json_template,
    render_template,
    utc_now,
    write_json,
)


ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"


def render_request(args: argparse.Namespace, run_dir: Path) -> dict:
    created_at = utc_now()
    values = {
        "sprite_set_id": args.sprite_set_id,
        "display_name": args.display_name,
        "description": args.description,
        "subject_notes": args.subject_notes,
        "style_contract": args.style_contract or DEFAULT_STYLE_CONTRACT,
        "created_at": created_at,
    }
    template_text = (TEMPLATES / "sprite_request.template.json").read_text(
        encoding="utf-8"
    )
    request = json.loads(render_json_template(template_text, values))

    atlas = request["atlas"]
    request["layout_guides"] = []
    for row in request["rows"]:
        request["layout_guides"].append(
            {
                "state": row["state"],
                "path": f"references/layout-guides/{row['state']}.png",
                "width": row["frames"] * atlas["cell_width"],
                "height": atlas["cell_height"],
                "frames": row["frames"],
                "cell_width": atlas["cell_width"],
                "cell_height": atlas["cell_height"],
                "safe_margin_x": request["safe_margins"]["x"],
                "safe_margin_y": request["safe_margins"]["y"],
                "usage": "layout guide input only; do not copy visible guide lines into generated sprite strips",
            }
        )
    return request


def write_prompts(run_dir: Path, request: dict) -> None:
    atlas = request["atlas"]
    base_values = {
        "display_name": request["display_name"],
        "subject_notes": request["subject_notes"],
        "style_contract": request["style_contract"],
        "cell_width": atlas["cell_width"],
        "cell_height": atlas["cell_height"],
    }
    base_template = (TEMPLATES / "prompts/base-sprite.md").read_text(
        encoding="utf-8"
    )
    (run_dir / "prompts/base-sprite.md").write_text(
        render_template(base_template, base_values), encoding="utf-8", newline="\n"
    )

    row_template = (TEMPLATES / "prompts/rows/state.md").read_text(encoding="utf-8")
    for row in request["rows"]:
        values = dict(base_values)
        values.update(
            {
                "state": row["state"],
                "purpose": row["purpose"],
                "frames": row["frames"],
                "strip_width": row["frames"] * atlas["cell_width"],
                "motion_beats": row.get("motion_beats", []),
            }
        )
        (run_dir / f"prompts/rows/{row['state']}.md").write_text(
            render_template(row_template, values), encoding="utf-8", newline="\n"
        )


def write_jobs(run_dir: Path, request: dict) -> None:
    created_at = utc_now()
    jobs = [
        {
            "id": "base",
            "kind": "base-sprite",
            "status": "pending",
            "prompt_file": "prompts/base-sprite.md",
            "input_images": [],
            "output_path": "decoded/base.png",
            "depends_on": [],
            "generation_skill": request["primary_generation_skill"],
            "requires_grounded_generation": False,
            "allow_prompt_only_generation": True,
            "source_provenance": None,
            "completed_at": None,
            "metadata": {},
            "canonical_reference_path": "references/canonical-base.png",
        }
    ]
    for row in request["rows"]:
        jobs.append(
            {
                "id": row["state"],
                "kind": "row-strip",
                "status": "pending",
                "prompt_file": f"prompts/rows/{row['state']}.md",
                "input_images": [
                    {
                        "path": f"references/layout-guides/{row['state']}.png",
                        "role": f"layout guide for {row['frames']} frame slots; use for spacing only",
                    },
                    {
                        "path": "references/canonical-base.png",
                        "role": "canonical identity reference",
                    },
                    {"path": "decoded/base.png", "role": "approved base subject"},
                ],
                "output_path": f"decoded/{row['state']}.png",
                "depends_on": ["base"],
                "generation_skill": request["primary_generation_skill"],
                "requires_grounded_generation": True,
                "allow_prompt_only_generation": False,
                "identity_reference_paths": [
                    "references/canonical-base.png",
                    "decoded/base.png",
                ],
                "parallelizable_after": ["base"],
                "mirror_policy": (
                    {
                        "may_derive_from": row["mirror_candidate_of"],
                        "derivation": "horizontal-mirror",
                        "requires_identity_symmetry_check": True,
                    }
                    if row.get("mirror_candidate_of")
                    else {}
                ),
                "source_provenance": None,
                "completed_at": None,
                "metadata": {},
            }
        )

    write_json(
        run_dir / "imagegen-jobs.json",
        {
            "schema_version": 1,
            "created_at": created_at,
            "run_dir": str(run_dir.resolve()),
            "primary_generation_skill": request["primary_generation_skill"],
            "jobs": jobs,
        },
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a sprite imagegen run folder.")
    parser.add_argument("--sprite-set-id", required=True)
    parser.add_argument("--display-name", required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--subject-notes", required=True)
    parser.add_argument("--style-contract", default=DEFAULT_STYLE_CONTRACT)
    parser.add_argument("--out-dir", type=Path)
    args = parser.parse_args()

    run_dir = args.out_dir or ROOT / f"{args.sprite_set_id}-run"
    run_dir.mkdir(parents=True, exist_ok=True)
    ensure_run_dirs(run_dir)

    request = render_request(args, run_dir)
    write_json(run_dir / "sprite_request.json", request)
    write_prompts(run_dir, request)
    write_jobs(run_dir, request)
    create_layout_guides(run_dir, request)
    print(f"Created sprite run scaffold: {run_dir}")


if __name__ == "__main__":
    main()
