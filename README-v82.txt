ORB Garment Studio v82 - Shared front and back layouts

INSTALL
This is a small update for the working v81 installation. Extract its contents
into your existing ORB repository, replacing the matching files. Merge the
assets folders; do not replace the whole assets directory. Commit and push as
usual, then reload after GitHub Pages finishes deploying. The info panel should
say ORB Studio 82.

WHAT CHANGED
Front and back artwork now use one fixed reference canvas per surface. All
placements on a surface share one uniform scale and translation per garment.
Lower-back artwork no longer follows the hem independently of the main design.
Spacing, overlaps, relative sizes and rotations remain together when switching.

The men's tee is the reference. Its existing artwork appearance is preserved.
Shorter garments fit the whole composition at a smaller scale. Mappings use
measured body-panel boundaries and a width limit, not the current layer bounds.
Adding or editing a layer does not cause other artwork to move or resize.
Front chest, full-front and hem placements use the same principle. Hoodie
pocket artwork participates in the front layout. Sleeves, hood panels, inside
neck tags and custom model anchors keep their existing placement behavior.

Detail-camera targets follow the mapped insertion positions. An active layer
close-up also updates its focus when switching garments. The info panel now
explains the shared layout behavior.

EXISTING DESIGNS
Files and browser saves using relative-v1 keep their stored layer adjustments.
They adopt the men's tee reference and are marked surface-v2 once loaded.
Garment switching never rewrites these coordinates. Older legacy projects are
also accepted. New .orb saves use format version 3 and require v82 or later.
Keep your original .orb file if you want to open it in an older app version.

The v81 full-resolution processing, caching and stepped slider-update cadence
are unchanged. This update does not change artwork treatment or source files.

NATURAL LIMITS
The fit preserves composition in flat print space. Fabric folds, perspective
and a hood can still hide or distort the visible print. Artwork deliberately
moved or enlarged beyond the fixed canvas can still cross a garment boundary.
The app does not silently reposition individual layers to prevent that.

VALIDATION
- Checked fixed front/back envelopes against 3,400 actual mesh samples.
- Checked 432 varied layouts through the production renderer's quad matrices.
- Checked 19 layers across three supplied Fireside projects, including the
  previous near-hem wordmark clipping case and overlapping rotated graphics.
- Verified exact men's tee reference placement, 30 garment-switch cycles,
  detail-camera targets, legacy migration, save/reopen and original asset bytes.
- Verified browser workspace recovery and export settlement/restoration using
  test harnesses. Confirmed v81 processing code is unchanged.
- Checked ZIP integrity and extracted files against their source bytes.

Live browser/WebGL visual testing was not available in this environment.
