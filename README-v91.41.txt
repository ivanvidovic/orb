ORB Garment Studio v91.41 — lighter mobile garment assets

Merge this cumulative update into the existing project, replacing matching files. Upload ALL FOUR files in assets/garments/mobile/ along with the updated code. Keep the original assets/garments/ files and existing calibration files. No deployment has been performed for you.

Mobile phones and tablets now load separate GLBs containing textures capped at 1024 pixels. Desktop retains the original full-quality GLBs and four-garment prepared cache. Mobile retains only its active garment. Garment geometry, indices, vertex ordering, UVs and material definitions are unchanged; every non-image buffer view was checked byte-for-byte against the source.

Hoodie decoded RGBA texture footprint: 192 MiB -> 12 MiB each (93.75% reduction).
T-shirt decoded RGBA texture footprint: 64 MiB -> 16 MiB each (75% reduction).
These figures exclude GPU copies, mipmaps, geometry and artwork. Surface texture detail is reduced on mobile; artwork source files and export resolution are unchanged.

Before switching on mobile, the workspace is saved, old presentation clones and artwork render targets are released, the old garment is removed, model geometry/materials/textures and image bitmaps are disposed, caches are cleared and renderer render lists are released. Loading begins after two animation frames. A failed save keeps the old model. A failed model load can be retried or the previous garment reselected. Startup mobile downloads avoid the manual stream/chunk concatenation buffer.

Preserves earlier viewport/orientation fixes, default sample and saved projects, library URL selection, toolbar, presentation settings, and existing glow implementation.

Validation: image dimensions and GLB buffer integrity; identical non-image buffers; mobile/desktop policy; release ordering and retry/save-failure behavior; shared resource disposal; sample persistence regression checks; JS syntax and ZIP integrity. No on-device Safari or Instagram crash testing was available. Geometry is still high-detail, especially the women's hoodie; this release reduces known allocation pressure but cannot guarantee freedom from browser termination without device testing.
