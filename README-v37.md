# ORB Garment Studio v37

Overlay the ZIP contents onto your existing repository, preserving the folders. This includes the v36 feature files; garments, calibration, and existing Three.js files do not need uploading again. Reload the page after publishing.

Changes:
- Compact four-step guide with expandable help topics.
- Medium-gray checkerboard behind library and layer thumbnails.
- Layer actions use two rows of three buttons; Change placement is now Placement.
- Browser autosave no longer closes color pickers or ends editing.
- Solid converts brightness to ink opacity, multiplied by existing image alpha. Black reveals fabric; white prints the selected color.
- Expand Solid settings for Cutoff, Softness, and Invert mask. Defaults: Cutoff 12, Softness 65. Lower Softness gives heavier ink coverage; higher Softness keeps gentler tonal transitions. Invert prints dark artwork instead.
- Solid settings persist in .orb files, browser recovery, duplicates, and Undo/Redo. Original and Tint rendering remain unchanged.
- Older Solid layers receive a one-time polarity migration. Check Invert mask if an older mixed-color graphic needs a different interpretation.

Validation: automated source-pixel mask checks, save/open and browser recovery checks, an autosave editing regression check, Undo/Redo checks, JavaScript syntax, and HTML ID checks passed. Live browser layout and GPU appearance were not visually verified in this environment. Please test the intended print character using your artwork.
