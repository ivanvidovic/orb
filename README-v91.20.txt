ORB Garment Studio v91.20

Merge into your existing project, replacing matching files. Cumulative update based on v91.19.

Toolbar: explicit intermediate two-row layout from 821–1280 CSS pixels; consistent control heights, single-line camera labels, and separate camera row in the compact 601–820 range. Existing logo heights retained.

Recovery: rejected database connections are cleared for retry on the next save; closed/version-changed connections reopen. Initial artwork setup no longer depends on successful storage reads or recovery. Distinct storage, restore, artwork and autosave errors appear in the status tooltip and developer console. If recovery fails, the previous current snapshot is backed up under recovery-backup before a successful autosave replaces it; an existing backup is retained. No database deletion or clearing. HTTPS requirement for artwork saving is reported explicitly.

The project status remains a compact icon, including errors. Hover or focus to read its message.

Preserves headerless bio, centered links, mobile emblem sizing, restored glow, and all other features. studio.js changes only its workspace import version.

Verification: JavaScript syntax; simulated database failure/retry/version-change tests; separate initialization failure tests; backup preservation tests; file comparison; ZIP integrity. User's original warning was not reproduced on their device; earlier HTTP access is a plausible trigger because artwork registration requires Web Crypto. Live browser visual testing was unavailable.
