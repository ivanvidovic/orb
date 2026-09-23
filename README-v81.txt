ORB Garment Studio v81 - Solid and print texture responsiveness

Based on the user-supplied v78 update. The v79 low-resolution preview and v80 procedural GPU experiments are not used.

INSTALL
Copy this ZIP's contents into your existing ORB repository, allowing file replacement. Keep the existing garment models and vendor files. Commit and push as usual. Reload after the GitHub Pages deployment finishes. The info panel should say ORB Studio 81.

WHAT CHANGED
- Full-resolution Solid and print processing runs in one background worker.
- Source preparation, tone data, Solid coverage and pattern structure are cached separately. Changing one stage reuses unaffected stages.
- Solid filters reuse buffers. Alpha Spread is cached before the cutoff curve.
- Only the newest pending slider value is retained per layer. Completed full-resolution samples can appear during dragging; no reduced-resolution previews are generated.
- Solid uploads use one coverage channel rather than RGBA. Same-sized texture allocations are reused.
- The last sharp result remains visible until replacement. Opening a project and initial startup wait for its full-resolution artwork; there is no blur-to-sharp sequence.
- Save Image and Export All wait for the final settings. Original source files and artwork packaging are retained.
- Undo cancels abandoned jobs without rebuilding unchanged layers.

VALIDATION
Used the supplied seven-layer Fireside project. Local CPU-only v78 treatment times were around 1.5-3 seconds per edit. Warm cached treatment measurements were approximately 0.07-0.60 seconds for tested print controls and 0.16-0.50 seconds for tested Solid controls. Moving the calculations to the worker kept the main event loop available during a heavy edit (16 ms timer gaps in the Node worker harness). First preparation of a different source and very heavy edge treatment still take longer than simple cached adjustments.

Compared full-resolution output against v78 across Original/Tint/Solid, all patterns, legacy/current treatments, fitting, Alpha cutoff endpoints, Spread and the actual project. Alpha differed by no more than one level out of 255; tested Sharing The Light outputs matched exactly. Verified seven-layer request coalescing, texture reuse, undo/removal, the worker and full-resolution fallback, export settlement/cancellation and original artwork preservation.

Actual browser GPU appearance, frame rate and texture upload times were not measured in this environment. Browsers without module worker support use the same full-resolution processor on the main thread.

No sidebar restyling, garment mapping, lighting or camera changes.
