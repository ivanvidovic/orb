ORB Studio 64 - Print texture
Overlay these files, publish, and refresh. Includes assets/js/print-texture.js.

Expand a layer > Print texture. Choose None, Dots, Lines or Grain; adjust Size
(fine to coarse), Angle and Strength. None is the default for existing/new art.
Patterns modify partial alpha coverage, after Solid cutoff/softness/invert.
Original and Tint keep their colors and pattern only partial transparency.
Opaque pixels remain solid; transparent pixels remain empty. Use Solid and
Softness to turn image shading into coverage before applying a pattern.
Patterns stay in source-artwork space through placement, rotation and fitting.
Appearance reset clears print texture. Settings persist in .orb files and Undo.

With artwork included in Export All:
Originals: unchanged source files, deduplicated.
Artwork: one smooth treated PNG per layer.
Artwork-textured: additional patterned PNGs for layers with texture enabled.
Artwork-reference.json links files and records pattern settings.
Mockups show the pattern. Visual styling only: no physical dimensions, LPI,
mesh specifications, or production-calibrated separations are assigned.

Verified preview/export alpha parity for all patterns, cropping and chunk
alignment, save/open/recovery of settings, original preservation and separate
exports. Existing export/history checks passed. Live browser visual QA pending.
Fine patterns may soften at distant zoom levels; high-resolution sources may
require a moment to recalculate texture when changing its controls.

If upgrading from v54-v57, delete obsolete assets/js/asset-rules.js,
assets/js/library-curation.js, and assets/downloads/ORB-Project-Folder-Template.zip.
