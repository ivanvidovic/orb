ORB Studio 58 - v53 rebuild

Overlay these files onto your repository, publish, and refresh.
Delete these obsolete files if present:
- assets/js/asset-rules.js
- assets/js/library-curation.js
- assets/downloads/ORB-Project-Folder-Template.zip
They are no longer referenced. Deleting them finishes the repository cleanup.

Uses the supplied v53 as its base. Only the compact design/save status row,
four garment buttons in one row, and simple recursive folder import were added.
The original v53 library thumbnails and rendering features are preserved.
Randomization, tags, placement rules, randomization locks and template help
have been removed. Folder names do not assign metadata. Empty folders and
non-image files are skipped. Use Add folder or drag a folder into the app.

Existing artwork/designs can still be opened; later randomization/tag metadata
is not retained by this version. Original .orb files are not modified.

Save/recovery, Undo/Redo, folder traversal, and package checks passed.
Live browser visual verification remains pending.
