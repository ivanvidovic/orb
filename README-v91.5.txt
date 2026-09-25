ORB Garment Studio v91.5 - Branching and performance update

INSTALL
Merge these files into your existing v91 through v91.4 folder and replace the included files. Keep your models, textures and asset libraries. Refresh the browser after updating. This is cumulative and includes clipboard paste, sleeve/focus cameras, organic patterns and Rounding from the previous updates.

NATURAL BRANCHING
Natural now grows long connected trunks with varied attached limbs and finer offshoots. Scale adjusts fineness without shortening the whole network or regenerating the structure. Thickness adjusts strand weight, Density changes growth coverage, and New variation changes the arrangement. Density, Angle and New variation rebuild the structure; other adjustments reuse it.

The uniform-fill fallback has been removed. Fine strands are antialiased locally along the actual paths, with empty space retained below Scale 30 and down to the minimum. At extremely fine settings, visible detail is limited by the preview/export pixel resolution. Zoom in or use a larger export to inspect fine strands.

Natural patterns in existing projects will use the revised growth algorithm. Repeat branching and Maze retain their established appearance.

PERFORMANCE
Natural scale edits reuse the cached geometry lookup instead of growing and rasterizing a new field. Rounding reuses bounded working buffers and equivalent-radius results, and avoids unnecessary color filtering for single-color graphics. The pre-rounding composite cache, full-quality worker processing, and latest-value queue remain in place. There is no temporary low-resolution preview. Large images still need time to process.

HELP
The long sidebar helper paragraph is replaced by compact info buttons beside Branching, Tone response, Erosion and Rounding. Hover, focus or click to read each explanation. Escape dismisses the tooltip. Expanded information remains in Info.

VALIDATION
Checked branch coverage at scales 0.001 through 100, increased density coverage, no repetition at the old tile interval, preview/PNG/PSD alpha consistency, old-pattern regression, saved-project validation and round trips, Rounding comparison against v91.4, and worker-transfer cache safety. Visually reviewed branching and Rounding comparison renders. Local 2048-pixel profiles showed substantially faster Natural scale edits. These are local rendering/markup checks, not a full browser or real-device benchmark.
