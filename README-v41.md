# ORB Garment Studio v41

Upload over the existing app, preserving folders. Include the new placement-space.js and placements-41.json. No garment model changes are needed. Earlier updates are included.

Placement changes:
- Torso anchors use consistent fractions of body width and neckline/neck-tag-to-hem length. Left and right chest placements are mirrored, with the earlier one-sided chest correction removed.
- Body print sizes scale with garment width instead of a blanket 0.78 hoodie multiplier.
- Sleeve patch and wrist anchors use their authored sleeve charts. Manual motion follows the sleeve reference dimensions; full-sleeve prints retain their existing full-length fitting.
- Specialty hood and inside-tag anchors retain their seam-calibrated locations, with proportional sizing and motion. The pocket follows its lower-front reference.
- Manual x/y adjustments are stored in a common reference space and evaluated for the selected garment. Switching never rewrites these values, avoiding cumulative drift.

Existing designs:
- Older .orb files and browser recovery data are automatically migrated on their saved garment, preserving the existing rendered placement, size and rotation.
- New or reset placements use the new aligned defaults. Migrated designs retain intentional or historical offsets rather than snapping to the new defaults.
- Move and reset use the new placement defaults. Switching back returns to the same placement.
- Saved files now use format version 2 and require v41 or later; v41 continues to read format version 1 files.
- Custom model surface anchors retain their original coordinate behavior. Garment-specific unavailable placements remain dormant until a supported garment is selected.

Validation:
Loaded all four actual garment geometries and their authored UV calibration. New anchors resolve on cloth; 222 old/new quad comparisons preserve center, size and orientation to numerical tolerance. Repeated cross-garment evaluation does not mutate stored coordinates. Mirrored chest anchors and bounded size factors verified. Save/open, browser recovery, Undo/Redo, source image preservation and treated artwork checks pass. JavaScript syntax checks pass.

Limit: no live browser/WebGL visual QA was available. Check your representative graphics on all four garments. Garment shape, seams and hood coverage still affect appearance; these are visual references, not verified physical print measurements.
