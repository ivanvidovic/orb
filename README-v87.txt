ORB Garment Studio v87

Merge this ZIP into your existing ORB repository root, replacing matching files. Keep your existing garment models, asset libraries and vendor dependencies. Commit the included files, deploy, and hard-refresh the page. This cumulative update includes v86's PSD writer and supports the working v81-or-newer base.

CHANGES
- PSD groups now display in Photoshop as Treated artwork, hidden Untreated artwork, then hidden Background preview. Artwork inside both groups follows the studio's top-to-bottom layer order. The stored layer stack and flattened composite now agree.
- Layout, Resolution and Background use compact, directly accessible button choices. Native radio semantics support keyboard navigation and visible focus.
- Related checkboxes share horizontal rows and wrap at narrow widths. Placement close-ups and per-surface print dimensions are directly visible.
- Each print surface has canvas width, canvas height and artwork width on one compact row, alongside Fit to canvas. Existing print-size behavior is preserved.
- A slim progress bar advances as preparation, mockups, per-layer artwork, PSD layers and ZIP packaging complete. Subtle movement indicates activity during long operations; reduced-motion settings disable that movement. Cancellation and errors stop the animation. Download, cancel and progress remain accessible at the bottom of the dialog.
- Women's hoodie full-view presentation scale is 10% smaller, around the same torso center. Saved v86 full-view cameras are adjusted once. Other garments, close-up views, artwork placement calibration and PSD physical dimensions are unchanged.

CHECKS
Verified the PSD group and layer order with an independent PSD reader and forced recomposition of overlapping layers. Real Chromium worker export and desktop/narrow export layouts passed, including selected-state buttons, compact type, print-size access and progress updates. Existing PNG export, renderer restoration and cancellation checks passed. Camera scale and one-time saved-camera migration passed.

Photoshop itself is not available in this environment. A corrected Fireside sample PSD is provided separately for your Photoshop check.
