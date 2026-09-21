# v37 verification

Passed:
- Solid black/white endpoints, inverted mask, alpha multiplication (allowing canvas premultiplication rounding), monotonic tonal coverage, softer/heavier ink responses, transparent padding, unchanged source pixels, legacy black starter polarity.
- Portable save/open restores Solid settings alongside colors, placement and effects. Existing format v1 files remain accepted with optional new fields.
- Browser autosave does not call finish editing; explicit archive saves still do.
- Browser recovery, deduplication and invalid-project rejection.
- Undo/Redo restores Solid Softness and existing placement, effects and garment state.
- JavaScript syntax for modified modules; 182 unique HTML IDs.

Limits: no live browser/GPU visual verification. The mask defaults are a starting point for the user's art direction review.
