# v36 validation

## Passed

- Syntax checks for all 10 app JavaScript modules.
- HTML ID uniqueness (178 IDs), referenced local assets, new control references, and relative module imports.
- All four supplied GLBs loaded for geometry inspection; mesh vertex/index counts match their corresponding calibration data.
- Export fit calculations checked against 576 projected garment bounding-box corners: four garments, three aspect ratios, six full views, eight corners per view. Each fits within the intended padding.
- Portable design ZIP round trip: version/schema validation, original image bytes retained, image deduplication across layers, unused-library inclusion option, and restoration of layer transforms, rotation, tint, glow/UV response, emission, lighting, and the pre-black-light background.
- Invalid portable designs leave the active design untouched.
- Browser persistence and recovery logic tested with an IndexedDB test substitute.
- Undo/Redo state tests for transforms, emission, fabric, lighting, glossiness, standard-placement changes, garment selection, redo-branch clearing, and shared image references.
- Export packaging tested with a substitute renderer and real PNG/ZIP encoding: six separate PNGs at fixed portrait resolution, transparent alpha, presentation-sheet inclusion, editable-file inclusion, and restoration of renderer size, pixel ratio, camera, transforms, and motion.
- Export cancellation restores state and does not download a partial package.

## Not verified here

Live browser interactions, responsive visual layout, actual GPU shader rendering, and final exported garment appearance were not visually reviewed. The cloud browser rejected local preview access, and a local browser download was unavailable. Geometry and format checks are not a substitute for that visual review.

The original model meshes, texture maps, calibration files, and material shader code were preserved. No GitHub repository or published site was changed in this session.
