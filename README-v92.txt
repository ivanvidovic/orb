ORB Garment Studio v92 — hats and custom leather patches

INSTALL
Merge the contents of this ZIP into your existing ORB repository. Replace matching files, including index.html. Keep the other existing assets. This is a cumulative v82–v92 update for the working v81+ installation. Commit/push as usual, then hard-refresh after Pages finishes deploying. It does not change your Pages workflow.

HATS
Apparel and Hats have separate artwork, fabric colors and camera states. Switching keeps both designs; the image library is shared. Save an ORB project to retain both. Existing ORB projects remain supported. The hat starts empty.

The supplied Five Panel Cap 01.glb is included intact. Its existing textile maps, seams, bill and hardware are retained. The viewer batches matching materials and gives artwork its own placement coordinates.

Nine placements: front panel, left side, right side, back panel, crown, upper bill, under bill, inside front and sweatband. Use the placement diagram, View on garment, or detail cameras. Key 7 shows the inside front; key 8 cycles the other placement cameras. Crown, upper bill and under bill have independent color controls. Suggested areas are optional guides; artwork can extend beyond them.

LEATHER PATCHES
Place a graphic, then choose Leather patch in that layer. Rectangle, oval and shield presets are available. Choose Custom SVG, Upload SVG, or Library SVG for a custom boundary.

Custom outlines need one closed, filled silhouette. Interior cutouts are supported. Separate pieces, live text, linked images, clipping masks and filters should be converted to a simple filled path first. Outline limit: 1 MB and 4,096 sampled points.

Patch width, height and position control the leather backing independently of the engraving's artwork scale, position and rotation. Corner rounding is available for rectangles. Leather color, thickness, engraving depth and edge stitching are adjustable. Oversized patches remain adjustable; an edge message indicates when a patch extends beyond its panel.

PRINT PACKAGE
Include grid is now off by default. Exports use the selected garment. The ORB project option stores both apparel and hat designs.

Layered PSD layouts include black engraving artwork clipped to the patch boundary, plus the hidden untreated source group. Each patch also gets a vector SVG cut outline and a dimensions JSON file in Patches. Dimensions follow the selected layout export scale. The default hat layout size follows the model's placement units. Leather grain, thickness, stitching and lighting are visual treatments, not baked into print artwork.

Embroidery and automatic tracing of raster silhouettes are not part of this update.

VERIFIED
Browser checks cover family switching, independent colors, all nine print surfaces, detail cameras, custom SVG cutouts, patch undo, project save/reopen, layered PSD and SVG export, and compact control typography. Release ZIP integrity is checked before delivery.
