ORB Garment Studio v91.4 - Natural branching and Rounding

INSTALL
Merge the contents into your existing v91, v91.1, v91.2 or v91.3 folder and replace the included files. Keep your existing models, textures and asset libraries. This cumulative update includes clipboard paste, sleeve/focus cameras, Maze and Branching from the previous updates. Refresh the browser after replacing files.

NATURAL BRANCHING
In Print texture, choose Branching, then Natural. Repeat retains the original tiled texture and is the default for existing designs. Natural generates unique wandering branches across the entire artwork. Scale, Density, Angle and New variation change its structure; Thickness, Tone response and Erosion reuse it. Very fine features blend into average coverage below the field's sampling resolution rather than generating aliasing or unlimited geometry. This is a finite artwork-wide field, not an animated growth simulation.

ROUNDING
Rounding is available in Print texture even with Pattern set to None. It processes each layer's completed artwork and pattern erosion together. Higher settings round corners, remove fine fragments and merge nearby contours while reconstructing crisp edges. In Solid mode, Edge softness follows Rounding when Rounding is enabled. At zero the previous processing behavior is unchanged. Start around 15-35 and increase for stronger reshaping.

SAVE AND EXPORT
Both settings are stored with the ORB project and retained in treated PNG and PSD exports. Original source files and the untreated PSD group remain untouched. Open projects using these features in v91.4 or newer.

PERFORMANCE
Generated branching fields and the pre-rounding composite are cached. Processing uses the existing full-quality artwork worker and latest-value queue. No temporary low-resolution preview is introduced. Changing pattern structure still requires regeneration; larger artwork and stronger treatments can take longer to update.

VALIDATION
Checked zero-rounding compatibility for existing patterns, full-stack rounding order, cache reuse, saved-project validation and round trips, transferred-buffer cache safety, Natural non-repetition, and preview/PNG/PSD alpha consistency. Visually reviewed generated texture and rounding comparison renders. These were local rendering checks, not a full browser interaction test.
