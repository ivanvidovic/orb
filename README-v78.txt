ORB Garment Studio v78

Overlay onto your current ORB files. From v77, replace index.html, assets/css/studio.css, assets/js/studio.js, and add assets/js/artwork-detail.js. Commit and push; your existing workflow handles deployment.

Artwork preview now concentrates each panel tile around the artwork, including a margin for light spill. No atlas size increase. All layers on a panel share the available area; widely separated graphics reduce the gain. Filtering stays smooth. Low-resolution source images cannot gain original detail from this change.

Dots, lines and grain use a higher-resolution working image where useful, up to 4x the source dimensions and a 4096-pixel long edge on desktop / 1024 on mobile. Already larger sources retain their resolution. Pixel treatment is unchanged. Source files and exported treatment resolution are unchanged; this update improves the preview. Extremely fine marks below its resolution still blend to prevent aliasing.

Layer names display a small dot for custom Tint or Solid colors. Original mode and automatic colors have no dot. Dot hover shows mode and hex. Existing thumbnail camera and row controls retain their behavior.

Checks: actual atlas layout with synthetic geometry, rotated bounds, placement mapping, crop invalidation, unchanged target sizes, pattern coordinate scaling, active color rules, existing shader injection and lighting tests. No live browser/GPU visual or performance verification.
