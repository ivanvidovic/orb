ORB Garment Studio v91.8 — sidebar scrolling and projector palettes

INSTALL
Extract into your existing project root, replacing matching files, including assets/calibration. Keep the existing garment models and brand libraries. Commit and push to GitHub, then reload after deployment. This cumulative update includes the v91.7 pocket correction and all post-v91 code updates; no hat work is included.

SIDEBAR
The sidebar now uses normal block flow instead of a flex column, with a reserved native scrollbar gutter. Its parent uses clipped overflow so keyboard focus cannot scroll the parent out of alignment. The active editor moves directly between layers instead of disappearing into a hidden container during every layer switch. Synchronous UI refreshes preserve the sidebar scroll offset, subject to normal clamping when content is deliberately shortened.
Existing wheel-over-slider behavior is unchanged. There is no scrolling timer, custom scrollbar or observer that continually resets your position.

PROJECTOR
Keep Caustics and Stripes, plus six new choices: Interference, Ripples, Liquid, Cellular, Kaleidoscope and Shards. Adjust pattern scale, motion speed and angle. New effects offer Distortion; Kaleidoscope also offers Symmetry.

Projection colors:
- Solid: one color.
- Gradient: two to four colors blended linearly or radially.
- Flow: an animated palette with its own Color speed, independent of Motion speed.
Use the existing color picker, including hex entry and reset. Pause freezes both pattern and color motion; editing a paused effect still updates the result. Pattern scale retains its 0.01 minimum. Older Geometry projects retain their original effect.

PERFORMANCE AND EXPORT
One projector light and one active GPU-generated texture are reused. Animation updates remain capped at 30 per second. The existing 512/1024 projection texture limits and shadow sizes remain in place. Static and paused projection maps are reused until edited. Colors and pattern settings are saved in .orb projects and affect mockups, not flat print artwork.

VALIDATION
- Live application UI with seven layers: 54 combinations of layer selection, artwork modes/patterns, lighting and palette modes at desktop, short-window and mobile sizes. Last control reachable in each case.
- Native wheel scrolling and scrollbar-thumb dragging reach the bottom. Same-layer refresh preserves scroll position. Focusing the final control does not scroll ancestor containers.
- Shared picker and palette controls update the correct state.
- All eight new/current patterns compiled and rendered using WebGL; checked colored output, pause/static caching, palette edits while paused, independent color motion and fine-scale texture budgets.
- Existing project compatibility, new settings serialization and input validation passed. Runway/Afterglow behavior and shadow budgets passed regression checks.
- The original intermittent cutoff could not be reproduced reliably in this environment. These changes remove the hidden-editor transition and the nested scrolling/flex layout risks; the interactive checks cover the updated behavior. Real hardware performance varies.
