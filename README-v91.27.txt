ORB Garment Studio v91.27

Merge into your existing project, replacing matching files. Cumulative update based on v91.26.

Moving shadows now refresh for every scene render, including both lighting-transition passes. Stationary shadow maps remain cached. This removes the 30 Hz shadow refresh limit that could produce chatter against smoothly moving garments and lights.

Night uses a black background and subtle grid, like the other dark lighting presets. Returning to regular lighting restores the previous background. Presentation backgrounds follow the lighting sequence and blend with transitions; a custom presentation background overrides this behavior. The two background patterns are cached between size changes and presentation sessions.

Numpad 8 activates Projector; subsequent presses cycle available patterns in dropdown order and wrap. Hidden and disabled patterns are skipped. Existing editing/dialog/presentation shortcut guards remain. Shortcut documentation and tooltips are updated.

Other cumulative features, glow shaders, GPU lighting compositor, presentation defaults, reset icons and deferred autosaving are preserved.

Verified JavaScript syntax, per-render shadow invalidation and stationary reuse, shortcut cycling and guards, background cache/blend/custom override, sequence/schema compatibility, GPU compositor resource lifecycle and autosave behavior. Rendering was mocked: actual visual smoothness and GPU performance could not be verified because the available browser has WebGL disabled.
