# ORB Garment Studio v40

Overlay these files on your existing app, preserving folders. Includes prior v39.1 spacing fixes and artwork export features. Upload the new assets/calibration/placements-40.json file and the updated placement-diagrams.js along with the other changes. No GLB changes or model reuploads needed.

Placements:
- Back neck, left/right shoulder blade, center chest, and left/right front hem on all four built-in garments.
- Left/right wrist on both hoodies, aligned to the existing sleeve panel direction above the sleeve ends.
- Existing Lower back retained as the lower-back-center option.

All new positions work through Add, Move, Duplicate, Undo/Redo, Save/Open, browser recovery and artwork packaging. Each position has a targeted view through the layer View action and the Detail camera menu. Export All offers optional Placement close-ups, including the inside neck tag. Unavailable wrist views are hidden on tees. Calibrated detail views are unavailable on custom GLBs.

Diagrams:
- Front, Back and Inside tabs show one larger diagram at a time.
- Click either a marker or its matching name; hover/focus highlights the matching marker and name.
- Wearer-relative left/right is correctly mirrored in the back diagram.
- Rear hoodie hood has a center seam and no front opening/fold lines.

Back-neck graphics on hoodies may be naturally obscured by the hood. Print assets remain independently available in artwork exports.

Validation:
- Loaded all four real GLBs with authored calibration. Verified 28 new anchors on the intended native fabric islands, including sleeve UV alignment and clearance above sleeve endpoints.
- Checked full diagram coverage, unique placements and marker spacing at 280px; visually inspected static diagram renders.
- Verified camera targeting for every new calibrated placement and existing neck-tag reset behavior.
- Save/open checks preserve new back-neck and wrist placement IDs. Existing Undo/Redo, treated artwork, source deduplication, autosave and export restoration/cancellation checks pass.
- Presentation export test includes an added back-neck close-up PNG.
- Syntax and HTML ID checks pass.

Limit: no live browser/WebGL visual QA in this environment. Review final camera framing, UV appearance and responsive layout in your browser.
