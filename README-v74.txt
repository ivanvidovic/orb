ORB Garment Studio v74

Copy contents over the existing repository, preserving folders. Keep existing models and vendor files.

Fix lights in scene is enabled for every preset, including Night, Runway, Afterglow and Projector. Checked holds the rig at its current orientation. Unchecked lets base lights, traffic and creative lights follow the view. Pausing animation is independent.

Typography: compact base sizing and sidebar defaults for text, headings, labels and form controls. Removed the duplicate Afterglow paragraph. Existing preset and control styles retained.

Runway: Standard is the new default, with the previous Active timing. Active is now denser and stronger. A soft overhead spotlight adds continuous stage presence alongside the rear rim. Existing saved activity choices remain available.

Projector: GPU-rendered procedural pattern, 512px normally and 1024px below scale 60, capped to device texture support. Filtered geometry edges; up to 30 pattern updates per second while moving. No continuous pattern redraws when paused or Speed is zero. Renderer target, viewport and scissor are restored after pattern rendering. Afterglow's light cycle is retained and now follows the rig orientation when unlocked.

Checks passed: source syntax, both lock states across all eight presets, GPU-target sizing and redraw gating with a renderer harness, runway pacing, save/open/recovery, export restoration. Live GPU shader compilation, visual appearance and performance remain unverified.
