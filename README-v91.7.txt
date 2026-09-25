ORB Garment Studio v91.7 — hoodie pocket placement fix

INSTALL
Extract this ZIP into your existing project root, replacing matching files. Include the assets/calibration folder from this update. Keep the existing garment models and image libraries. Commit and push, then reload after deployment. This cumulative update includes v91.1 through v91.6 code changes and no hat work.

CAUSE AND FIX
Both hoodie pocket placements had been calibrated onto the front body panel underneath the separate pocket fabric. The front was receiving artwork, but the pocket hid it.

The new calibration targets the actual outer pocket surface on both men's and women's hoodies. Pocket layers retain their artwork scale, offset units, rotation and treatment settings. Shared front/back placements remain unchanged.

Pockets are independent print surfaces, so their artwork is listed as Hoodie pocket in the PSD export, and Fit front layout no longer moves pocket artwork. Pocket layers remain dormant on tees.

Existing .orb files use the corrected pocket surface automatically. Designs with offsets adjusted while the artwork was hidden may need repositioning. Explicit custom surface anchors remain where they were placed.

VALIDATION
Checked against the production meshes: the former pocket placement is occluded by pocket fabric on both garments; the corrected placement reaches the visible pocket surface. Verified actual renderer transforms against flat export transforms, legacy placement migration, unchanged non-pocket profiles, and repeated garment switching without modifying saved adjustment values.
