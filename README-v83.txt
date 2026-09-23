ORB Garment Studio v83 - Torso framing and larger hoodie back layouts

INSTALL
Merge this update into the existing v81 or v82 installation, replacing matching
files. Keep the remaining assets and folders. Commit and push, then reload once
GitHub Pages deploys. The info panel should show ORB Studio 83.

CHANGES
- Full-view camera distance follows measured torso width, with focus at the
  body center. Garment switches preserve viewing angles and relative zoom.
- Men's hoodie back artwork is approximately 23% larger than v82. Women's
  hoodie back artwork is approximately 4% larger. These are uniform increases
  for the whole layout, preserving relative spacing, overlap and proportions.
- Tee artwork placement and front canvas mappings retain v82 behavior. The
  framing adjustment affects all four garments for a comparable torso size.
- Presentation exports share a torso-normalized framing envelope that includes
  all garments' hoods and sleeves, retaining space around the full views.
- Existing full-view cameras in saved projects adopt the new framing once.
  Deliberate close-ups retain their saved camera settings.

FIT LAYOUT
Open any front or back artwork layer to find the compact Fit layout button
beside the layer-order and reset controls. It fits visible artwork into the
current garment's panel, moving or shrinking the entire side together. Hidden
layers receive that same transformation to retain their alignment. It never
enlarges an already fitting design. Undo restores the previous composition.

Fitting is an explicit design edit shared across garment previews. Switching
garments and adjusting a graphic do not automatically refit the composition.
An unusually tall design may extend off a shorter hoodie with the larger
default canvas; use Fit layout when that is not desired. Fabric folds and hood
occlusion continue to affect visibility naturally.

The accepted v81 artwork-processing cadence and resolution are unchanged.

CHECKS
Verified 414 composition cases through the actual renderer matrices, uniform
fitting of rotated layers, hidden-layer registration, undo handling, repeated
fit as a no-op, repeated garment switching, saved-camera migration and equal
torso scale in portrait/square/wide exports. Inspected the production mesh
positions and fit-region boundaries. Tested PNG/ZIP export and state restoration
with the export harness. Checked update ZIP integrity and extracted bytes.

Live browser/WebGL appearance and UI layout were not visually tested here.
