Create the {{state}} animation row for {{display_name}}.

Input images:
- Layout guide: references/layout-guides/{{state}}.png. Use this for frame spacing only; do not copy any guide lines, boxes, labels, or markers into the generated art.
- Canonical identity reference: references/canonical-base.png. Preserve this subject identity.
- Approved base subject: decoded/base.png. Keep the same silhouette language, palette, facial design, and proportions.

Subject: {{subject_notes}}

Style contract: {{style_contract}}

Animation contract:
- State: {{state}}
- Purpose: {{purpose}}
- Exact frame count: {{frames}}
- Cell size: {{cell_width}}x{{cell_height}}
- Target strip shape: {{strip_width}}x{{cell_height}}
- Motion beats in order: {{motion_beats}}

Output a single horizontal strip with exactly {{frames}} full-body frames on a perfectly flat pure magenta #FF00FF chroma-key background. Each frame must be centered in its slot, fully visible inside safe margins, and readable at {{cell_width}}x{{cell_height}}.

Keep identity consistent across the entire row. Do not add scenery, text, borders, labels, shadows, glows, loose effects, checkerboard transparency, or guide markings. Do not use #FF00FF or near-magenta inside the subject.
