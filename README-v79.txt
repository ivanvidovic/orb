ORB Garment Studio v79

Overlay this package on your current repository, commit and push. The existing GitHub workflow publishes it.
From v78, replace index.html, assets/js/studio.js, assets/js/print-texture.js, assets/js/presentation-export.js. Add assets/js/pattern-raster.js, assets/js/pattern-worker.js, assets/js/pattern-jobs.js.

Pattern-only optimization:
- Dots, lines, grain and pixel use a preview capped at 512 pixels during editing.
- After a 180 ms quiet period, full resolution is generated in one module Web Worker using OffscreenCanvas.
- Obsolete queued edits are dropped and obsolete running results discarded. Unchanged treatments stay cached.
- Save Image and Export All wait for current full-resolution patterns before capture.
- Glossiness, lighting and non-pattern artwork keep their existing update paths.
- Browsers without the required worker/canvas support fall back to deferred main-thread full-detail generation; they may briefly pause during refinement.

Validation: full-resolution raster output compared byte-for-byte with v78 across 24 pattern/mode/crop cases; queued-edit coalescing, stale-result disposal, settlement and fallback; export quality wait, cancellation and renderer restoration. Actual browser worker/GPU rendering and interaction performance not verified here. Try the seven-layer design and inspect detail after refinement.
