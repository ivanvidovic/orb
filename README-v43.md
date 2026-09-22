# ORB Garment Studio 43

Extract over the existing ORB repository, replacing matching files. Keep existing garments, textures, and vendor assets. Publish and refresh; the guide footer should say ORB Studio 43.

City night now has a cool ambient fill and warm overhead streetlight. Its steady direct and environment lighting use one quarter of the previous strength at 100%. Changing colors means this is a starting-point brightness calibration, not a pixel-identical match to the old 25% setting.

Passing white headlights and occasional red tail/brake lights move across the garment with varied speeds, directions, and quiet intervals. Traffic offers Off / Subtle / Active and Pause traffic lights. Reduced-motion preference starts traffic paused. City lights remain fixed in the scene while the camera rotates. Intensity scales both base lighting and traffic and is remembered separately from Studio/Day and Black light.

Export All freezes traffic across its camera views and resumes afterward. Save Image captures the displayed moment. Traffic preferences persist in designs and browser recovery; the animation resumes from the session's traffic clock, not a saved frame. Older files load the new city defaults. Former city color values remain in the file schema for compatibility but no longer drive this preset.

The existing background remains customizable. This update adds no rain, fog, buildings, or animated backdrop. Three extra directional lights use no additional shadow maps; they are hidden outside City night.

Validation: traffic envelope continuity, quiet intervals, headlights and brakes, zero intensity, Off, pause/resume, preset exit, scene-fixed rig, export clock suspension, schema compatibility, portable save/recovery, history restore, export cleanup/cancellation, and JS syntax passed. Live browser/WebGL visual verification was unavailable. Evaluate City night at 100% on both light and dark garments; a darker background helps judge the effect. Use Pause to hold a passing light and compare export views.

All v42 placement calibration changes are included unchanged.
