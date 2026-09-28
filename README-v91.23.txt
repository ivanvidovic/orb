ORB Garment Studio v91.23

Merge into your existing project, replacing matching files. Cumulative update based on v91.22, not a standalone app. Include all new CSS and JavaScript files in this ZIP.

Toolbar and cameras
- Eight direct Lighting buttons: Studio, Softbox, Day, Night, UV, Runway, Afterglow, Projector. Numpad 1–8 follows the same order.
- Detail menu groups: Front, Back, Sleeves, Inside. Neck tag is under Inside. Artwork close-up is removed from this menu; existing layer inspection and export functionality remain available.
- Camera keys 1–5 retain main views. Key 6 cycles available details forward in menu order; Shift+6 cycles backward. Old camera assignments for 7/8 are removed. Documentation and tooltips updated.
- Toolbar uses one row from 1600px, two planned rows below that, and deliberate section grids at narrower widths. Lighting becomes a 4-by-2 grid below 1100px; Camera becomes a 3-by-2 grid from 601–799px. Mobile keeps the visible preview controls and Output/More menus.

Presentation settings
- Located directly below Environment. The gear beside Present collapses other sidebar sections, expands Presentation, scrolls to it and focuses its heading. Present still launches immediately.
- Optional lighting cycling, checkbox selection, ordering arrows, hold time (1–600 seconds), and fade time (0–30 seconds). No selection uses current lighting; one selection holds that preset. Cycling is off by default.
- Transitions blend two live renders, including their fabric/UV response, using the current camera and garment geometry. They do not alter the restored glow shader. Two rendering passes and canvas compositing are used only while fading; this costs more than holding one preset.
- Optional presentation background color and an artwork-library graphic behind the garment. Controls: original/solid color, custom color, opacity, width, horizontal position, vertical position.
- Starting camera, rotation toggle and rotation speed. Existing desktop garment pair and mobile single garment are retained. Reduced-motion preferences disable rotation.
- Exit with Esc or a tap. Editing camera, lighting settings and saved lighting reference are restored. Transient playback settings are excluded from project snapshots.
- Presentation settings and the selected graphic travel with .orb files, including when unused library graphics are excluded. Older projects receive default presentation settings.

Verification
JavaScript syntax; HTML IDs and placement; sequence hold/fade/wrap/zero-fade/empty-selection behavior; project validation and old-project compatibility; background-only asset packaging; shortcut mapping; simulated settings focus, two-pass compositing and restoration; existing mobile-menu, bio and recovery checks; calculated Rubik text fit across 320–1920px; unchanged embedded shaders and creative-lighting module; ZIP integrity.

Limitations
Browser access prevented running this local update with WebGL. Actual transition appearance, device frame rate and browser-rendered layout remain unverified. The automated compositing checks use mocked rendering. Please check the deployed app on desktop and mobile, particularly transitions involving UV, Projector and City Night. Lower fade duration or use instant transitions if the extra rendering cost is too high on a device.
