ORB Garment Studio v85

INSTALL
Merge into your current v81-v84 installation, replacing matching files. Keep existing models, vendor files and asset libraries. Commit and push as usual. Confirm ORB Studio 85 in the info panel.

CLOSER DEFAULT FRAMING
Front and back presets now use a closer camera distance. The men's hoodie front view closely matches Fireside_Current-view (5).png, about 14% larger on screen than the preceding default.
The same adjustment applies across garments, preserving their relative proportions. Three-quarter views are also closer, with extra cuff clearance. The side preset retains its previous distance because it already nearly fills the frame vertically.

Existing saved full-view cameras migrate once while preserving their relative zoom. Choose Front (shortcut 1) to inspect the new default framing. Dedicated detail cameras, artwork placement, garment calibration, lighting, processing cadence and Export All framing are unchanged. Save Image captures the current closer view as usual.

VALIDATION
Checked all 20 full-view projections across the four actual garment meshes, using the production camera offset. At the reference 2048x1198 viewport, the men's hoodie front silhouette spans approximately y=99 to y=1151, compared with y=97 to y=1151 in the desired screenshot. Verified camera migration, relative garment scales and close-up preservation. ZIP CRC and extracted bytes verified.
Live browser/WebGL appearance has not been tested in this environment. Fabric motion can slightly change silhouette edges.
