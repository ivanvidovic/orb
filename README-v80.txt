ORB v80 GPU pattern trial

From v79, replace index.html and assets/js/studio.js, and add assets/js/gpu-print-pattern.js. Commit and push. Existing workflow handles deployment.

Dots and Lines (current version-2 treatments) are calculated during GPU compositing. Adjusting spacing, angle, mark size, tone response or erosion reuses the source and mask textures. No worker queue or low-resolution texture swap for those patterns. Initial mask preparation and changes to cutoff/edge settings still require CPU processing.

Grain, Pixel and legacy version-1 treatments retain the v79 worker/preview behavior. This is the first, focused GPU trial. Glossiness and unrelated controls are unchanged.

The shader uses the existing coverage math and extra screen-space antialiasing to reduce shimmer. Treated artwork export retains the existing CPU algorithm and source resolution; GPU antialiasing can differ slightly at small/angled views. Original assets remain unchanged.

Validation: actual compositor/source-cache harness with seven layers and 30 successive pattern edits: seven initial source uploads, zero further uploads and zero worker jobs for dot/line changes. Changing Solid cutoff rebuilds only the affected source. Analytical coverage comparison matches CPU within one alpha level before screen-space filtering. Export settlement, cancellation, and renderer restoration tests passed. No live browser shader compilation, GPU visual or performance verification.

For comparison, test a dot or line layer in the same seven-layer design, especially Spacing, Dot size/Line width, Angle and Erosion. Grain and Pixel have not moved to GPU in this version.

Rollback: use ORB-v80-rollback-to-v79.zip and push its two replacement files. This restores v79 behavior without changing saved designs.
