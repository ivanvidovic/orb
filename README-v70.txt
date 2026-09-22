ORB Garment Studio v70

Copy contents over your current repository, preserving folders. Include the new assets/js/solid-mask.js module. Keep existing models and vendor files.

Grain now uses continuous deterministic noise instead of cell-centered specks. Grain size controls coarseness; Tone response and Erosion remain. Spacing and Angle are hidden for Grain. Existing v2 grain changes to the organic renderer; older legacy grain retains its original renderer.

Solid settings: Auto selects Alpha for single-color art and Brightness for tonal sources. Alpha maps original transparency through Cutoff and Softness, without brightness multiplication or inversion. New uploads default to Auto; existing designs keep Brightness until you select Auto or Alpha. Spread grows or shrinks flat silhouettes, and Edge softness smooths their boundaries. These effects remain inside original source image bounds. Fit includes available margins for edge treatment.

Mask and edge settings persist in portable designs/autosave and apply to smooth and textured artwork exports. Original sources remain unchanged.

Validation: JavaScript syntax; alpha detection/cutoff/softness; flat-shape spread/shrink/softening; preview/export alpha parity including pixel and edges; organic grain crop/chunk consistency; existing pattern regressions; export original-byte preservation; save/open/recovery. Live browser/WebGL visual verification remains pending.
