ORB Garment Studio v91.11 - Projector palette and glow update

Extract into your existing ORB repository root and replace matching files.
Keep your existing garment models and artwork assets. Commit and push as usual.
This is a cumulative update for v91, including the v91.10 Paper effects.

PROJECTOR
- Neuro Noise replaces Caustics in the selector and is the default effect.
  Saved Caustics selections migrate to Neuro Noise.
- Gradient and Flow support 2 to 12 colors, selected with an integer slider.
- Shuffle beside each color changes that swatch; the Palette shuffle changes
  all visible colors. Reducing color count preserves unused swatches.
- Effect and color modes use compact buttons. Effect-specific adjustments
  collapse away while Scale, Motion and Colors remain accessible.
- Fine logarithmic scale and extended motion-speed controls are retained.

GLOW
- Removed the steep per-fragment darkness gate that produced bright strips
  in folds. Restrained emission now adds to normal surface lighting, with
  scene-wide suppression in bright environments.
- Afterglow charge/decay and UV response remain separate.
- Nearby simulated glow spill uses the corrected response too.

PERFORMANCE AND CHECKS
- One active projection pass, fixed-resolution Paper target, cached shader
  programs, no new per-layer lights or post-processing passes.
- Verified shaders compile, twelve-color rendering, palette randomization,
  project save/restore, legacy migration, fine scale input, pause and speed.
- Actual garment materials compile with the updated glow shader.
- Full-scene performance and glow appearance still need your GPU review.
  Twelve colors cost more in effects that calculate a field per color.

Projection lighting affects mockups, not exported print artwork.
Paper shader licenses and adaptation notices are included.
