ORB Garment Studio v91.13 - Glow history, scrolling and projector scale

Extract into your existing ORB repository root, replacing matching files.
Keep existing garment models and artwork assets. Commit and push as usual.
This cumulative update includes the previous v91 updates.

PROJECTOR
- Pause occupies its own aligned action row, outside slider/input grids.
- The old physical scale of 15 is now displayed as 100 and is the default.
  Old project values retain their appearance. Stored physical units are
  unchanged; the UI converts displayed values in both directions.
- The full previous fine/coarse range remains available (displayed range
  approximately 0.0667 to 2000). Logarithmic slider travel is retained.

GLOW IN THE DARK
- Genuine exposure history replaces the instantaneous shadow gate and the
  previous constant-emission approximation.
- Artwork starts uncharged. Expose it to Studio/Day lighting for a few seconds,
  then switch to Night to review the gradual reveal and decay.
- A 128 x 128 UV-space map measures actual scene lighting for each mesh with
  glowing artwork. History updates at 10 Hz and interpolates between updates.
- All layers on a mesh share that history. No artwork texture rebuilds, CPU
  pixel readbacks or additional shadow renders are needed for charging.
- Charge persists after light moves away; sustained darkness builds a reveal
  buffer and emission fades in. Brief moving shadows do not trigger a flash.
- Afterglow's moving light now charges through this same history. Its Fade
  seconds control sets charge decay. Pause stops the light's movement; charge
  continues to evolve. UV fluorescence remains a separate effect.
- Charge is temporary preview state and resets with garment loading or an
  artwork-atlas layout change. It is not baked into print artwork.

SIDEBAR
- Added a stable inner content box inside the single native sidebar scroller.
- Removed expanding-section geometry animations and the idle panel transform.
- Checked repeated expand/collapse cycles and native wheel scrolling to the
  bottom, with an active artwork editor and twelve projector colors, at four
  desktop/mobile viewport sizes. The exact intermittent user-reported lock
  was not reproduced; these checks passed with the revised structure.
- Slider wheel behavior is unchanged.

VALIDATION
- Actual garment material/light-history shaders compile and run in WebGL.
- Tested uncharged darkness, bright-light charging, delayed reveal and decay.
- Checked numeric scale conversion/reset, Pause layout, and scroll reachability.
- History allocates only for meshes using glow; three small targets per mesh.
- Hardware-specific frame rate and final glow appearance need user review.
- ZIP integrity and included files checked against the working source.
