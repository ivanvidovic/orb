ORB Garment Studio v91.15 - Correct light capture and persistent glow

Merge into your ORB project root, replace matching files, and hard-refresh.
This cumulative update retains the preceding v91 changes. Include the new
assets/js/glow-layout.js file when committing or uploading.

CORRECTED ROOT CAUSE
The UV-space capture used Three's gl_FrontFacing normal inversion after the
mesh was flattened into texture space. Replacing that token in the unexpanded
shader did not replace it inside Three's normal shader include. On the actual
men's tee, the previous capture read zero exposure in the tested front chest
region under a front light. The corrected capture reads the illuminated area.
Capture now uses the garment's physical normals without fabric normal/bump maps.

GLOW BEHAVIOR
- Stored charge emits immediately; no darkness gate, reveal timer or delayed
  interpolation. Charge updates occur before the visible garment render.
- Repeated exposure adds to the remaining charge, approaching saturation.
- Two charge reservoirs provide an initial brighter fade and a persistent tail.
  Default decay time constants are 4 seconds and 180 seconds. These are
  exponential decay constants, not cutoffs; the slow tail lasts for minutes.
- The existing fade setting (now labeled Initial fade) controls the initial phase, with a longer
  tail derived from it. Both now apply identically under every lighting preset.
- Switching lighting presets preserves charge and decay behavior.
- Charge coordinates follow fixed full garment panels rather than changing
  artwork bounds, so artwork moves/resizing no longer reset or relocate history.
- Up to 256 pixels per panel, independent gutters and clamping replace the
  previous 128-pixel shared map. Atlas dimensions are capped at 2048.
- Deterministic 16-bit packed storage replaces noisy rounding on devices that
  lack floating-point render targets. UV fluorescence remains separate.
- Charge is temporary preview state. It resets when loading another garment
  or disabling/removing all glowing layers on a mesh; it is not print artwork.

VALIDATION
- Compiled the actual patched capture and visible garment shaders in OpenGL ES.
- Rendered the actual men's tee geometry with the production capture shader.
- Ran the shipped history shader on captured exposure: no charge in darkness,
  visible charge on the first dark frame, brighter overlapping exposure, and
  retained emission after 120 simulated seconds of darkness.
- Verified deterministic RGBA8 fallback accumulation, decay and persistence.
- State checks confirm all eight presets retain the same history allocation
  and decay setting; artwork layout changes preserve the same history.
- JavaScript syntax and ZIP integrity passed.

Review/glow-verification.png is a controlled diagnostic rendering of the actual
tee mesh, with a simple test ink patch. Capture/history use the production
shaders; the display uses a simplified material, not the full ORB viewport.
The old/new capture comparison holds atlas resolution fixed to isolate normals.
Browser access to the local app was blocked. Full browser interaction, all
four garments, and hardware frame rate were not visually verified this run.
The larger maps use more GPU memory/work, while keeping the existing two
history passes at 10 Hz only for meshes with glowing artwork.
