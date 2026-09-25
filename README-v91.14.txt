ORB Garment Studio v91.14 - Accumulating glow

Extract into your ORB project root and replace matching files, then hard-refresh.
This cumulative v91 update retains the v91.13 layout and scale changes.

GLOW
- Charged artwork emits continuously, with no darkness gate or delayed reveal.
- Exposure builds local charge; overlapping light passes add to retained charge.
- Stronger/longer exposure produces more charge, smoothly approaching saturation.
- Charge decays after exposure. Existing Afterglow Fade seconds remains effective.
- Charging and emission are stronger so passing lights leave visible afterglow.
- Ambient light affects contrast through ordinary scene lighting, without switching
  the stored-charge emission off. Unexposed artwork starts uncharged.
- Existing low-resolution history maps and update frequency are retained.
  No extra render passes, textures, lights, or controls were added.
- UV fluorescence and print exports retain their existing behavior.

VALIDATION
- Passed charge behavior checks for unexposed darkness, single and overlapping
  sweeps, stronger exposure, decay, saturation, time-step consistency and Fade.
- Verified shader injection for the actual garment and exposure materials.
- All 24 included JavaScript modules pass syntax checks; ZIP integrity passes.
- Browser/WebGL rendering was unavailable in this run. Full garment appearance
  and hardware frame rate have not been verified for this revision.

Charge remains temporary preview state and resets on garment loading or an
artwork-atlas layout change, as in v91.13.
