ORB Garment Studio v73

Copy contents over your existing repository, preserving folders. Include the new assets/js/creative-lighting.js. Keep existing models and vendor files.

Eight lighting presets now occupy two rows of four using existing compact styling. Numpad 6: Runway. Numpad 7: Afterglow. Numpad 8: Projector. Existing shortcuts remain unchanged.

Runway: dim base plus irregular white/warm/cool flashes. Activity, expandable Flash intensity, overall Intensity and Pause. Gentle by default.
Afterglow: an orbiting charging light plus a stylized periodic surface charge/fade for layers marked Glow in the dark. Charge speed, Fade seconds, overall Intensity and Pause. This is an appearance simulation, not measured phosphorescence or a per-surface physical exposure history.
Projector: fixed spotlight with animated Caustics, Stripes or Geometry. Pattern scale, Speed, overall Intensity and Pause. Speed 0 holds a static pattern. Uses native spotlight projection and self-shadow maps when Self-shadows is enabled.

New presets use dim backdrops and fixed scene lights. Returning to regular presets restores the prior background. Each preset remembers independent intensity and animation controls. Reduced-motion preference starts the effects paused. Export All holds the light/pattern/charge moment across views. Mockups include the effects; print-artwork exports remain unaffected. Help and shortcuts are updated.

Validation passed: JavaScript syntax; eight-button structure; deterministic pattern and flash checks; quiet intervals; pause/resume and preset isolation; zero intensity; native projector-map/shadow wiring; afterglow shader injection; export animation gate; editable save/open/autosave recovery; history; multi-view export and renderer restoration. Shader injection was checked against the vendored Three.js source, but live browser/GPU compilation and final visual tuning remain unverified in this environment.
