ORB Garment Studio v91.17 - Glow rollback to v91.10

Extract into your existing ORB project root, replace matching files, then
hard-refresh. This cumulative update keeps the other changes through v91.16.

The complete garment shader block is restored byte-for-byte from the supplied
ORB-Garment-Studio-v91.10-projector-effects-update(1).zip. This restores its
original glow response, Afterglow behavior, brightness and fabric spill.

Removed the later charge-history initialization, updates, texture allocations,
charge-coordinate preparation and shader dependencies. The new glow-history.js
and glow-layout.js are not included or referenced. Copies left in an existing
folder are inactive and do not need to be deleted for the rollback to work.

Restored the original glow help text and Fade seconds label. The later Pause
alignment and all non-glow interface changes remain intact.

PRESERVED
- Projector effects, 12-color palettes, individual and whole-palette shuffle.
- Compact projector controls and typography/spacing updates.
- Recalibrated projector Scale, fine slider control and expanded motion speeds.
- Quick lighting toolbar, sidebar scrolling structure and layer drag behavior.
- Pocket placement fixes and current saved-design/export behavior.

VERIFICATION
- Full shader block matches the supplied v91.10 exactly.
- Generated Standard and Physical material shaders, uniform names, program
  cache keys and Afterglow defaults match that version exactly.
- No later charge-history runtime references remain.
- All 27 other code/style/calibration/license files are byte-identical to the
  v91.16 update. Only studio.js and glow-specific HTML/help/cache text changed.
- JavaScript syntax and ZIP integrity passed. No new browser visual test was
  performed; this restores the supplied implementation rather than retuning it.
