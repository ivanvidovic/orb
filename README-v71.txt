ORB Garment Studio v71

Copy contents over your current repository, preserving folders. Include assets/js/sleeve-camera.js. Keep existing models and vendor files.

Sleeve camera pivots now sit inside sleeve cross-sections at the placement height. Each garment has its own left/right sleeve calibration, plus separate wrist calibration for hoodies. The camera presets and View on garment share those pivots. Active sleeve inspection follows its calibrated center when switching garments. Close zoom includes conservative sleeve clearance. Print positions and UV calibration are unchanged.

Checks: all 12 pivots derived from actual garment sleeve geometry; View/preset routes match; front/side/back projection stays centered on the pivot; print anchors remain unchanged; JavaScript syntax and ZIP/source verification passed. Live browser/WebGL visual verification remains pending.
