# Codex-Style Sprite Imagegen Runbook

This document packages the sprite-production method used by the existing Codex pet runs so another Codex instance can reuse the same framework for general sprite generation in a different project.

Use the existing `snow-cat-run` directory as the canonical example of the framework. The important thing to transfer is the production method: structured requests, identity references, layout guides, per-row imagegen jobs, chroma-key extraction, atlas assembly, and validation. The target output does not need to be another Codex pet.

There are two related locations:

- Production workspace: this project's run directories, such as `snow-cat-run/` and `runs/<pet-id>-run/`.
- Codex runtime install, only relevant when the output is actually a Codex pet: `$CODEX_HOME/pets/<pet-id>/`.

The production workspace contains the prompts, references, QA, manifests, extracted frames, and final sheets. For non-pet projects, this production workspace is the important part. The Codex runtime install section is an example consumer format, not the goal of the framework.

## Goal

Create a complete sprite pack using image generation, deterministic post-processing, and QA artifacts.

The output should include:

- A canonical identity reference image.
- One generated strip per animation state.
- Extracted transparent frame PNGs.
- A final fixed-grid spritesheet or target atlas in PNG and WebP.
- A frame manifest and validation report.
- A QA contact sheet for visual review.

## Recommended Package Shape

Each generated sprite set should live in a self-contained run directory:

```text
<sprite-set-id>-run/
  sprite_request.json       # pet_request.json in the existing example runs
  imagegen-jobs.json
  prompts/
    base-sprite.md          # base-pet.md in the existing example runs
    rows/
      idle.md
      running-right.md
      running-left.md
      waving.md
      jumping.md
      failed.md
      waiting.md
      running.md
      review.md
  references/
    canonical-base.png
    layout-guides/
      idle.png
      running-right.png
      running-left.png
      waving.png
      jumping.png
      failed.png
      waiting.png
      running.png
      review.png
  decoded/
    base.png
    <state>.png
  frames/
    frames-manifest.json
    <state>/
      00.png
      01.png
  qa/
    contact-sheet.png
    review.json
  final/
    spritesheet.png
    spritesheet.webp
    validation.json
```

The runtime install directory is intentionally much smaller:

```text
$CODEX_HOME/pets/<pet-id>/
  pet.json
  spritesheet.webp
  spritesheet.png   # optional but useful as a lossless/reference copy
```

Observed `pet.json` shape:

```json
{
  "id": "snow-cat",
  "displayName": "Snow Cat",
  "description": "A polished white-haired cat girl Codex pet with compact chibi proportions, cat ears, tail, and a calm coding companion personality.",
  "spritesheetPath": "spritesheet.webp"
}
```

## Sprite Contract

The existing Codex pet profile uses this default atlas:

- Columns: `8`
- Rows: `9`
- Cell size: `192x208`
- Final sheet size: `1536x1872`
- Chroma key: pure magenta `#FF00FF`

The existing Codex pet profile uses these default rows:

| Row | State | Frames | Purpose |
| --- | --- | ---: | --- |
| 0 | `idle` | 6 | Neutral breathing or blinking loop |
| 1 | `running-right` | 8 | Rightward locomotion loop |
| 2 | `running-left` | 8 | Leftward locomotion loop |
| 3 | `waving` | 4 | Greeting gesture |
| 4 | `jumping` | 5 | Anticipation, lift, peak, descent, settle |
| 5 | `failed` | 8 | Sad, failed, or deflated reaction |
| 6 | `waiting` | 6 | Patient waiting loop |
| 7 | `running` | 6 | Generic in-place running loop |
| 8 | `review` | 6 | Focused inspecting or review loop |

Unused cells in a row should remain transparent in the final sheet.

For other sprite projects, replace the row/state table with the target project's animation contract. Keep the same discipline:

- Fixed cell size.
- Explicit row and column mapping.
- Known frame count per animation.
- Transparent unused cells.
- A validation report that checks the target atlas exactly.

## Style Contract

Use this house style only when the target project wants Codex-pet-like sprites:

> Codex digital pet sprite style: pixel-art-adjacent low-resolution mascot sprite, compact chibi proportions, chunky whole-body silhouette, thick dark 1-2 px outline, visible stepped/pixel edges, limited palette, flat cel shading with at most one small highlight and one shadow step, simple readable face, tiny limbs, and no detail that disappears at 192x208.

Avoid:

- Polished illustration.
- Painterly rendering.
- Anime key art.
- 3D render.
- Vector app-icon polish.
- Glossy lighting.
- Soft gradients.
- Realistic fur or material texture.
- Anti-aliased high-detail edges.
- Complex tiny accessories.
- Text, labels, loose effects, scenery, shadows, glows, or extra props unless explicitly requested.
- Magenta or near-magenta inside the character, because `#FF00FF` is reserved for chroma key.

For another project's visual language, replace the style contract with that project's art bible. Keep the same level of specificity: silhouette, outline, palette, shading, detail budget, resolution-readability, and negative style constraints.

For Eve party sprites, use the archived party style rules or recreate them from the current in-game party sheets before generating replacement art. That style contract overrides older pixel-art-adjacent/chibi language for party character generation.

## Workflow

### 0. Understand The Underlying Codex Pieces

The image generation capability comes from the Codex `$imagegen` skill. In a local Codex install, use the installed image generation skill instructions for the current environment.

```text
$CODEX_HOME/skills/.system/imagegen/SKILL.md
```

That skill says to use built-in `image_gen` by default, and for transparent or cutout-like assets to generate on a flat chroma-key background first, then remove the chroma key locally. This sprite framework builds on that general imagegen behavior with a stricter sprite contract, fixed atlas layout, per-state row prompts, and validation artifacts.

The loaded pets themselves live under:

```text
$CODEX_HOME/pets
```

Each installed pet has a small `pet.json` metadata file and a spritesheet referenced by `spritesheetPath`. Treat this as a useful example of a consuming runtime, not as a requirement for non-pet sprite projects.

### 1. Create `sprite_request.json`

Capture the production spec:

- `sprite_set_id`
- `display_name`
- `description`
- atlas dimensions
- row definitions
- chroma key
- subject or character notes
- style contract
- generation skill, usually `$imagegen`

This file is the source of truth for the run. The current pet examples call this file `pet_request.json`; a generalized framework should use `sprite_request.json` or another project-specific name.

### 2. Generate The Base Identity Reference

Create `prompts/base-sprite.md`. The existing pet examples call this file `prompts/base-pet.md`.

The base prompt should ask imagegen for one centered, full-body subject or canonical asset on a flat pure chroma-key background. It should be strict about the style contract and should forbid scenery, text, borders, checkerboard transparency, and detached effects unless the target project explicitly requires them.

Save the generated result as:

- `decoded/base.png`
- `references/canonical-base.png`

The base sprite becomes the identity anchor for every row.

### 3. Prepare Layout Guides

For each animation state, create a layout guide strip in `references/layout-guides/<state>.png`.

Layout guides are input images only. They describe:

- Number of frame slots.
- Cell width and height.
- Safe margins.
- Rough pose rhythm.

The prompt must tell imagegen to use the guide for spacing only and not copy guide lines into the generated art.

### 4. Generate Row Strips

For each state, create `prompts/rows/<state>.md`.

Each row prompt should include:

- The subject identity from the base reference.
- The style contract.
- The exact number of frames.
- The desired motion beats.
- The target strip shape.
- The chroma-key requirement.
- A reminder that each frame must be centered, fully visible, and readable at the target cell size.

Use these image inputs:

- `references/layout-guides/<state>.png` as the layout guide.
- `references/canonical-base.png` as the identity reference.
- `decoded/base.png` as the approved base subject.

Save outputs as `decoded/<state>.png`.

Directional rows can be generated independently, or one direction can be deterministically mirrored from the other if the subject has no text, handed prop, asymmetric logo, or direction-specific design detail.

### 5. Record Jobs

Maintain `imagegen-jobs.json` as a ledger.

For each job, record:

- `id`
- `kind`
- `status`
- `prompt_file`
- `input_images`
- `output_path`
- dependencies
- generation skill
- source provenance
- hashes when available
- completion timestamp
- metadata such as width, height, mode, and format

This makes the run auditable and easy for another Codex instance to resume.

### 6. Extract Frames

Convert each generated row strip into individual frames:

- Remove `#FF00FF` chroma-key background.
- Fit each frame into a transparent `192x208` canvas.
- Keep the character centered and inside safe margins.
- Save frames under `frames/<state>/<index>.png`.

Create `frames/frames-manifest.json` listing every output frame and method used.

### 7. Build Final Spritesheets

Compose the final atlas:

- `final/spritesheet.png`
- `final/spritesheet.webp`

Place each state on its assigned row and each frame in order from column `0`.

Transparent empty cells should be preserved after the last used frame in each row.

### 8. Validate

Create `final/validation.json`.

Validation should confirm:

- Final image dimensions are exactly `1536x1872`.
- Format and mode are usable by the target app.
- Every required used cell has nontransparent pixels.
- Unused cells are transparent.
- No validation errors remain.

Create `qa/contact-sheet.png` so a human can quickly inspect identity consistency, pose readability, cropping, and motion order.

### 9. Install Into Codex

This step is only for Codex pets. For another sprite project, replace this with that project's import or asset-copy step.

After validation passes, install the pet into `$CODEX_HOME/pets/<pet-id>/`.

Required files:

- `pet.json`
- `spritesheet.webp`

Recommended files:

- `spritesheet.png` as a lossless/reference copy when available

The installed `pet.json` should use the runtime-facing camelCase fields:

```json
{
  "id": "<pet-id>",
  "displayName": "<Display Name>",
  "description": "<short pet description>",
  "spritesheetPath": "spritesheet.webp"
}
```

Keep the full production run directory in the project. Do not treat `$CODEX_HOME/pets/<pet-id>/` as the source of truth; it is the installed artifact.

## Quality Bar

A run is complete only when:

- The subject identity is consistent across all rows.
- The silhouette remains readable at the target cell size.
- The generated art follows the target style contract instead of drifting into a different medium.
- No row has copied layout-guide markings.
- No frame is cropped.
- Backgrounds are transparent in extracted frames and final sheets.
- Animation rows read in the intended order.
- The final validation report has `"ok": true`.

## Best Transfer Strategy

For another project, copy this runbook plus one successful example run such as `snow-cat-run`. Then have the other Codex instance generalize the framework around the target project's sprite contract:

1. Scaffold a run directory from a sprite request.
2. Generate prompts and layout guides.
3. Invoke imagegen for base and row strips.
4. Record jobs in `imagegen-jobs.json`.
5. Extract frames.
6. Build final atlas files.
7. Validate and produce QA artifacts.
8. Export or install the final spritesheet into the target project's runtime asset format.

The most useful next step is to turn this runbook into a template pack:

- `templates/sprite_request.template.json`
- `templates/prompts/base-sprite.md`
- `templates/prompts/rows/<state>.md`
- `templates/layout-guides/*.png`
- `scripts/extract_frames.*`
- `scripts/build_spritesheet.*`
- `scripts/validate_spritesheet.*`

That gives another Codex instance both the instructions and the filesystem contract it needs to implement the system cleanly.
