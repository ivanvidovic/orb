# ORB Garment Studio 42

## Install
Extract this update into your existing ORB repository, replacing matching files. Keep your existing garments, textures, and vendor folders. This package includes the earlier v41 update files plus the v42 correction.

After publishing, refresh the page and check that the guide footer says ORB Studio 42.

## Change
Men's hoodie back graphics now share a uniform layout scale with the men's tee reference. Artwork dimensions, movement offsets, and the Back neck, shoulder blade, and Lower back anchors use the same scale. Related detail cameras target the corrected surface points.

Only men's hoodie back calibration changes. Other garments and men's hoodie front, sleeves, hood, and inside neck tag retain their existing calibration. Saved layer values and artwork files are not rewritten. Existing men's hoodie back designs will display using the corrected calibration.

## Validation
- Checked the actual renderer's placement matrices with all three back graphics in Fireside Test 01.orb.
- Checked 180 combinations of back slots, rotation, scale, and aspect ratio.
- Checked 30 garment-switching cycles without layer-coordinate drift.
- Checked 222 legacy migration cases, preserving their pre-migration geometry.
- Projected all five corrected anchors onto the actual men's hoodie back mesh and checked detail-camera targets.
- Verified all other garment and placement records are unchanged.
- JavaScript syntax check passed.

Live browser/WebGL visual verification was unavailable. Open Fireside Test 01.orb, select Back, and switch between Men's T-shirt and Men's Hoodie. Check the lower magenta shape's overlap with the green artwork, then Back neck and shoulder-blade detail views. Folds and hood occlusion still affect the rendered appearance naturally.
