ORB Garment Studio v91.21

Merge into your existing project, replacing matching files. This is a cumulative update based on v91.20, not a standalone app.

Toolbar: removes the forced two-row breakpoint through 1280px. Measures control widths to keep one row when space permits; aligns a compact second row when needed. Retains existing desktop/mobile logo heights.

Tooltips: project status uses the shared viewport-clamped tooltip outside the sidebar. Hover, focus, or tap the status icon to read it.

Recovery: recognizes historical PNG bytes saved under SVG names, preserving the image bytes. New bundled-logo saves retain their original SVG source. Keeps prior recovery retry and backup protections without clearing browser storage.

Models: hides public model-upload controls and disables direct model-file imports. Saved custom-model projects remain supported. Custom garment modeling and ORB integration are described as a paid service, with a Contact Ivan link to the artist panel.

Info and FAQ: reorganized quick start and sections for saving/exporting, artwork placement, print treatments, lighting, common questions, and keyboard shortcuts. Print exports appear in quick start and the first detailed section. FAQ links open relevant sections. Projector and pattern documentation is grouped with its relevant controls.

Preserves the headerless artist bio, centered links, mobile emblem sizing, restored v91.10 glow mechanism, and previous cumulative updates.

Verification: JavaScript syntax; simulated recovery retry, initialization, backup preservation and mislabeled-image tests; simulated toolbar width transitions; artist-dialog interaction checks; source diff and ZIP integrity checks. Full visual and 3D testing could not be completed because the available browser cannot initialize WebGL. Toolbar transition tests use simulated measurements; please check the deployed app at your affected widths.
