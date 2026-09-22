ORB Garment Studio v68

Copy the contents over your current repository, preserving folders. Keep your existing models and vendor files.

Print texture now separates Spacing from Dot size / Line width / Grain size. Tone response reads shading before Solid cutoff (transparency in Original and Tint). Erosion removes ink even from fully solid regions. Angle remains. Use Tone response 0 for uniform texture; lower mark size for lighter, finer marks at the same spacing.

Existing saved patterns use the previous renderer until a texture control is adjusted. Original files and smooth treated exports remain available alongside the textured PNGs. New settings persist in designs and autosave.

Validation: source-function tests passed for preview/export alpha matching, chunk/crop alignment, independent mark size, full-ink erosion, pre-cutoff tone, silhouette preservation, subpixel averaging, portable save/open/recovery, original-byte preservation, legacy texture behavior and history. JavaScript syntax checked. Live browser/WebGL visual verification remains pending.
