ORB Garment Studio v86 - Layered print packages

INSTALL
Merge this ZIP's contents into your existing ORB repository root, replacing matching files. Keep your existing garments, artwork libraries, other assets and vendor folders. This is a cumulative v82-v86 overlay for the working v81-or-newer studio, not a standalone site. Include the new assets/vendor/ag-psd folder when committing. Hard-refresh after deployment.

EXPORT ALL -> DOWNLOAD PRINT PACKAGE
The export ZIP is now named <design>_Print-Package.zip. Existing mockup PNGs, presentation sheet, separate treated artwork, unchanged originals and optional editable .orb remain available.

Include layered PSD layouts adds one PSD per occupied print surface under Layouts/. Related front placements share one document; related back placements share another. Sleeve, neck-tag and hood charts have separate documents. All-hidden or unavailable surfaces are omitted. Hidden layers on an included surface remain hidden in its PSD.

Each PSD contains:
- Treated artwork: named pixel layers, preserving stacking order, relative position, rotation and visibility. Solid/Tint, cutoff, softness, spread, edge softness and enabled print patterns are rendered into these pixel layers.
- Untreated artwork: a hidden, aligned backup group using source colors and alpha. Hide Treated artwork before enabling this alternative.
- Background preview: a hidden gray layer for inspecting white artwork. Keep it hidden for printing.
- An embedded sRGB profile and 300 PPI document resolution.

PRINT SIZE
Open a surface's compact disclosure in the export dialog. Torso canvases default to 12 x 18 inches; sleeves use 4 x 18, inside neck tags 4 x 4, and other panels 8 x 10. Artwork initially fits the canvas proportionally. Canvas width/height and artwork width are independent. Artwork height follows its original proportions. Fit to canvas never stretches the composition. Oversized dimensions are supported, for example 18 x 24 inches; 12 x 18 is a starting size, not a maximum.

Sizing choices persist while the studio remains open, per garment/surface. They are not yet saved in the .orb file. Check physical dimensions against the actual garment before production. The 3D garment's visual calibration does not establish real-world inches. A screen frame needs extra clearance outside the chosen artwork size.

The browser export has a 48-megapixel canvas budget at 300 PPI and a separate total layer memory budget. It reports oversized requests rather than silently reducing output resolution. PSD generation runs in a dedicated worker; Cancel export stops the worker. Current browsers with OffscreenCanvas and module workers are required for the PSD option. Other exports remain available without this support.

OUTPUT NOTES
Flat layouts preserve the calibrated composition, not garment folds or scene lighting. Hood occlusion, seams and panel clipping are not baked into the PSD; inspect the mockups for placement and boundary context. Glow and UV intent, layer references, dimensions and raster scaling are recorded in Layouts/Layout-reference.json. PSDs are RGB pixel layers, not vector paths, editable Photoshop effect stacks or spot-color separations. Original SVG and raster files remain unchanged in Originals when artwork + originals is selected.

Treatments are generated for the requested print resolution from original sources. A larger output cannot restore missing detail in a small raster image. Fine print patterns may resolve more clearly than in a screen preview; they are visual effects, not a calibrated screen mesh or halftone frequency. Have the printer confirm separations, underbase, trapping and screen settings.

VALIDATION
- 888 placement-transform comparisons against the v85 garment renderer, including rotations, all four garments and full sleeves.
- 30 treatment/crop combinations checked against the existing artwork processor.
- Real Chromium worker export to PSD ZIP; compact control typography and no horizontal overflow checked at desktop and narrow viewport widths.
- Your Fireside Test 01.orb loaded in the full studio and downloaded as three layered PSDs: Back (3 layers), Front (1), and Inside neck tag (2).
- PSD dimensions, resolution, transparency, group order, layer visibility and sRGB profile checked with independent PSD-reading software.
- Existing mockup export, camera restoration and cancellation checks passed. Camera calibration and the accepted full-resolution slider-processing cadence are preserved.

Photoshop itself is not available in this environment. Please test the first real package in Photoshop and with your printer before production use.
