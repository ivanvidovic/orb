ORB Garment Studio v91.22

Merge into your existing project, replacing matching files. This is a cumulative update based on v91.21, not a standalone app. Include the new assets/css/toolbar.css file.

Toolbar layout
- 1200px and above: one row with visible Camera, Lighting, Wind, Output and Interface sections.
- 601–1199px: two deliberate rows. Logo, Output and Interface above; Camera, Lighting and Wind fill the row below.
- 600px and below: logo and Output/More menus above a full-width Camera strip, with Lighting and Wind below. Frequent preview controls stay visible. Output and More reveal their original controls in a floating panel.
- Section labels align above the controls. Buttons share the available section width evenly. Camera receives more space than Wind or Lighting.
- Keeps the existing Lighting and Detail camera menus, shortcuts, desktop wordmark, and mobile emblem height.
- Mobile utility panels close on selection, outside click, Escape, focus leaving, or resize. Original action buttons are retained, preserving their existing handlers.

Implementation scope
The toolbar now uses one CSS grid definition with two responsive breakpoints, replacing the previous width-measurement/wrapping script. The new stylesheet loads after existing application styles. studio.js changes only the Lighting button text to avoid repeating its section label. Glow, artwork, garment rendering, exports, recovery, artist bio and other functionality are unchanged from v91.21.

Verification
JavaScript syntax; HTML ID and control preservation; calculated text fit using the app's Rubik font at every integer viewport width from 320–1440; simulated mobile-panel interaction and artist-dialog tests; source comparison; ZIP integrity. These are not browser-rendered layout tests. Browser access prevented rendering the local update, so visual alignment and live end-to-end behavior remain unverified. Check the deployed app at your affected widths after replacing files.
