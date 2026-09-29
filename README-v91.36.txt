ORB Garment Studio v91.36

Merge into your existing project, replacing matching files, including the new assets/samples folder. Cumulative update based on v91.35.

The supplied ORB Mockup 01.orb is now the initial sample only when browser recovery storage confirms there is no saved session. The sample archive is included unchanged, with all three original SVG assets, artwork treatments, placements, camera and lighting settings. All three assets populate the artwork library. Sample artwork rendering settles before the loading screen closes.

Existing sessions take priority, including edited samples, imported projects and intentionally blank designs. No random samples or new sample-selection controls. Autosave remains enabled after successful initialization. Storage-read or saved-project restore failures pause startup with a retry message and leave stored work untouched; the sample is never substituted after those failures.

Verified startup branch behavior with mocked storage: first visit, edited/imported/blank sessions, read/restore/fetch/write failures. JavaScript syntax, three embedded SVGs, sample byte identity, unrelated-file preservation and ZIP integrity checked. Actual WebGL rendering and reload persistence have not been browser-tested. Browser storage can still be cleared or unavailable; downloadable project saves remain the portable backup.
