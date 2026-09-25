ORB Garment Studio v91.10 - Designed projector effects

Extract into the existing ORB repository root and replace matching files.
This cumulative update includes v91.9 and the earlier v91 updates.
Keep existing garment models and artwork assets. Commit and push as usual.

PROJECTOR
- Neuro Noise, Warp, God Rays, Mesh Gradient, Grain Gradient and Radial Bloom.
- Adapted from Paper Shaders; license and notices included in assets/licenses.
- Radial Bloom adds outward-moving color with a stable spotlight boundary.
- Relevant controls appear per effect: softness, swirl, grain, density,
  spotlight edge, center position and form variations.
- Selecting a new effect enables the existing palette if Solid was selected.
  You can still choose Solid or animate the palette with Flow.
- Caustics and Stripes remain. Older effects reopen with their saved designs.

CONTROLS
- Scale retains 0.01 to 300, now with logarithmic thumb travel and precise
  decimal input. More of the track is devoted to values below 1.
- Motion speed: 0 to 4000 (20 times the previous maximum).
- Color speed: 0 to 2000. Slow movement remains accessible.
- Changing speed keeps the animation position continuous; Pause stops both.

PERFORMANCE
One active projection pass; shader programs are cached and reused. New effects
use a fixed 1024-square projection texture to avoid resolution switching.
Fine detail is filtered when it falls below the available pixel resolution.
Heavy garment rendering has not been benchmarked on your particular GPU.

Projection lighting affects mockups, not the treated print artwork.

CHECKED
All six shaders compile and render in WebGL. Tested small scales, program
reuse, pause, speed continuity, exact numeric entry, resets, project saving,
state restoration and validation of older projector designs. ZIP CRC verified.
