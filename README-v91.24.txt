ORB Garment Studio v91.24

Merge into your existing project, replacing matching files. Cumulative update based on v91.23, not a standalone app. Include the new assets/js/present-compositor.js file.

Presentation performance
- Replaces per-frame WebGL-to-Canvas2D copies with reusable half-float GPU render targets and a GPU blend pass.
- Uses the app's ACES tone mapping and sRGB output transform in the blend pass. Premultiplied alpha keeps the background separate. Targets use the renderer's existing pixel density.
- When smooth cycling is enabled, holds render the garment once and fades render it twice. Each active preset updates its moving effects once per frame, removing duplicate projector/effect work.
- Targets allocate at entry, resize only when needed, and dispose on exit. The output shader is prepared at entry. Graphics devices without the required WebGL2 floating-point render-target support use instant switches and show a note in Presentation settings.
- Presentation background artwork redraws only after a setting, asset, or viewport change.
- Ordinary camera/fabric shadow updates now honor their existing intended 30 Hz cadence. Preset changes still refresh shadows so outgoing and incoming views use the correct lighting.
- Removes unconditional autosave notifications from every pointer release and excludes navigation-only toolbar/accordion clicks. Actual edits and manual orbit releases still notify recovery.
- Pending automatic recovery writes wait until visible presentation playback ends. Hiding the tab still requests a save. Unchanged revisions skip redundant writes.

Requested UI changes
- Reset presentation restores current camera, current lighting, original rotation speed, rotation on, no lighting cycle, no custom background color, and no background graphic. It changes presentation settings only and participates in undo/saving. Reduced-motion preferences still suppress automatic rotation.
- Present and its gear retain separate actions but now have a shorter, faint divider.

Preserved
Glow and creative-lighting shader code, garment rendering features, camera/lighting toolbar layout, project compatibility, background asset saving, artist bio, and existing exports.

Verification
Syntax and ZIP integrity; actual Three.js r160 render-target objects with mocked rendering; one/two scene-pass behavior, target reuse, disposal/re-entry, viewport/scissor restoration including render errors, expected shader chunks; background-cache and reset tests; autosave deferral/resume/hidden-tab/unchanged-revision tests; prior sequence/project/asset/shortcut/recovery/bio/mobile-menu tests; unchanged embedded shaders and creative-lighting module.

Limitations
Live WebGL rendering and device frame-rate measurements remain unavailable here. These checks establish code-path behavior, not a measured FPS gain or verified visual output. GPU fades still render two garment views, so complex lighting and high-resolution screens retain a real GPU cost. Check transition color, edge quality, frame rate, resize and repeated Present entry/exit on your device.
