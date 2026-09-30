ORB Garment Studio v91.37

Merge into your existing project, replacing matching files. Cumulative update based on v91.36, including the initial sample.

Mobile/touch devices no longer preload the garment catalog. Raw garment and calibration download promises are released after preparation, on success or failure. The decoded model cache retains only the active garment after a successful switch. The previous garment remains available while its replacement loads, so a failed load does not leave an empty preview.

Before a mobile garment switch, pending edits are written to browser recovery storage. A failed save prevents the switch. Startup restore remains protected, and first-visit sample behavior is unchanged. Library query parameters, including ?library=fireside, are retained and the hosted-library loading path is unchanged.

Verified with mocked runtime checks: no mobile preloading, cache eviction keeps active garment, forced save bypasses rendering lock, unchanged sessions skip writes, save failures propagate, and saved-session/sample startup branches. JavaScript syntax and cumulative ZIP integrity checked. No on-device memory measurement or browser-crash reproduction was available; this addresses identified memory retention, but cannot confirm all mobile reloads are resolved. Model loading still temporarily overlaps the old and new garment for safe replacement.
