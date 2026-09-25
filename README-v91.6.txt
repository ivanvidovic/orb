ORB Garment Studio v91.6 — branching scale and sidebar interaction update

INSTALL
Extract this ZIP into your existing ORB project root (the folder containing index.html), replacing matching files. Keep your assets, models and libraries. This update includes code changes since the full v91 release; no hat work is included. Commit and push the extracted files to GitHub. Reload the page after deployment.

CHANGES
- Natural Branching Scale now zooms a centered, cached network across a 24x range. Lower values show more, smaller branches; higher values zoom into longer stretches. Thickness controls strand width independently. No repeating tiles or silhouette-fill fallback.
- The variation action is now a compact shuffle icon beside Pattern, using existing control styling. It appears for Maze and Branching.
- Reordering layers preserves the existing expanded/collapsed selection. A completed drag does not trigger a layer click; subsequent clicks still toggle normally.
- Sidebar layout explicitly preserves expanded section heights and constrains scrolling to the available viewport. Automatic scroll anchoring is disabled in the sidebar. Wheel-over-slider behavior is unchanged.

VALIDATION AND LIMITS
- Browser pointer-drag checks passed for collapsed layers, an already open layer, subsequent clicks, and keyboard reorder.
- Fully expanded sidebar content reached its last control at 1280x720, 1920x1080, 1280x500 and 700x800. The reported intermittent cutoff could not be reproduced before the safeguards, so this still needs confirmation in your usual session.
- Treated PNG and PSD coverage matched preview output in Original, Tint and Ink modes. Existing rounding, cached composite reuse and save/restore checks passed.
- Scale and Thickness reuse the generated network. Seed, Density or Angle changes generate a new one. Previews remain at full resolution.
- Natural Branching will look different at existing Scale values because Scale now changes the network view. Other pattern types retain their behavior.
