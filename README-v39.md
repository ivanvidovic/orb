# ORB Garment Studio v39

Upload over your existing app, preserving folders. Includes the prior artwork export and label fixes. No model or calibration changes needed.

- Main camera presets remain directly accessible, with no cycling arrows.
- Detail opens Artwork close-up and Neck tag options. The selected detail is highlighted; the trigger reads Neck tag when active.
- Neck tag uses the current built-in garment calibration, including when switching garments while in that view. Custom GLBs have no calibrated neck view, so this option is disabled.
- Detail options support keyboard focus, Escape and outside-click dismissal.
- Layer actions use one compact line: + Add, Replace, Move, Duplicate, View, and a close icon. Add retains add-at-current-placement behavior. Custom models retain Set position.

Validation: syntax and unique HTML IDs passed; camera checks cover tag focus, garment retargeting, reset to full view, custom fallback and orbit deselection. Live browser layout and WebGL appearance were not visually verified in this environment.
