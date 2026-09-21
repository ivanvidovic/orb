# ORB Garment Studio v36

## Install

Extract ORB-Garment-Studio-v36-update.zip into the root of your existing ORB repository, alongside index.html. Merge the assets folders and replace matching files. Keep the existing garments, calibration, Three.js, Draco, and Rubik files. This is an update package, not a standalone copy of the entire repository.

Commit the updated files and the new files together. The HTML uses v36 cache keys for the changed stylesheet and app modules. No build step, account, or server is required beyond the existing GitHub Pages hosting. The ORB branding remains in place.

## Added

- Session colors in every color picker: up to 12 unique applied colors, most recent first. Includes sampled and preset fabric colors. Remembers the palette across refreshes within the browser session.
- Artwork library: batch drop/upload, thumbnail selection, search when the tray grows, and removal from the tray without removing placed layers. Full image canvases for unused tray uploads are released until needed.
- Add artwork, Add here, and Replace can use existing library graphics or new uploads.
- Change placement for built-in garments uses the existing standard placement diagram. Artwork, colors, transparency fitting, and effects stay with the layer; position, rotation, and size reset to the destination's defaults. Custom GLBs retain surface picking because they do not have calibrated standard locations.
- Duplicate creates an independent layer with the same artwork and appearance.
- Undo / Redo retains up to 40 snapshots, including layer edits, placement, fabric and lighting changes, and garment changes. Ctrl/Cmd Z undoes; Ctrl/Cmd Shift Z or Ctrl Y redoes outside text fields.
- Save design produces a portable .orb file for the current garment. Used artwork is included once even when repeated across layers. Unused library graphics are optional. A custom GLB is embedded if one is active; built-in models are referenced by their stable IDs.
- Open accepts .orb files through the Open button or a file drop. Opening or starting a new design offers Save first. Invalid files are checked before replacing the current design.
- Automatic browser recovery remembers the current design and artwork library for this page. It does not sync across devices. Save a .orb file for a portable backup. Browser storage errors are reported beside the design name.
- Visible camera and lighting names, Reset view, and a collapsed Environment section keep primary design controls easier to find.

## Export

Save Image downloads a 2048 px long-edge PNG of the current camera composition, with the current background and grid.

Export All downloads one ZIP containing selected views. Front, front three-quarter, left side, right side, back three-quarter, and back are selected by default. Detail is an optional closer crop.

Choose square, portrait 4:5, or landscape 16:9; 2048, 3072, or 4096 px long edge; and current, white, or transparent background. The current grid is optional. Full views share one camera distance calculated from the garment bounds, with comfortable margins. The detail view deliberately crops closer.

Optional additions are a labeled presentation-sheet PNG and the editable .orb design. Images use the current fabric, artwork, materials, and lighting. Export temporarily stills fabric motion and restores the preview afterward. Export can be cancelled before download.

The PNGs are visual mockups. Editable files store the app's artwork and placement settings; they are not sewing patterns or production separations.

## Files in this update

- index.html
- assets/css/studio.css
- assets/js/studio.js
- assets/js/color-picker.js
- assets/js/workspace.js (new)
- assets/js/design-format.js (new)
- assets/js/presentation-export.js (new)
- assets/vendor/jszip/jszip.min.js and its license (new)

JSZip is bundled locally. No new runtime CDN dependency was added. The existing 3D models and their calibration data were not modified.

## Validation

See VALIDATION-v36.md. Code and data checks passed, including the actual garment geometry and calibration files. A live browser/WebGL visual review could not be completed because this session's browser was blocked from opening local preview URLs. The update is not represented as visually verified.
