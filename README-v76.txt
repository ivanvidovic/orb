ORB Garment Studio v76

Overlay the ZIP contents onto your ORB directory.
From v75, only index.html, assets/js/studio.js and assets/js/creative-lighting.js changed.

Projector: Pattern scale now spans 0.01 to 300, step 0.01. Use the number field for fine values such as 5, 1 or 0.1. Detail finer than the projection/display can resolve gradually blends toward an even tone. GPU generation remains capped at 1024 square pixels with mipmap filtering and at most 30 updates per second.
Runway: Two sweeping spotlights, directional clustered flashes, Gentle/Standard/Active pacing. Reuses existing lights. Pause, intensity and Fix lights in scene remain available.
Glow: Reduced visibility in ordinary folds with a smoother darkness response and stronger suppression in bright scenes. No temporal delay added. Afterglow charge and decay remain unchanged; UV response unchanged.

Validation: renderer harness, real Three.js objects and shader injection checks; moving/pause lighting checks; zero intensity and preset isolation; scale 0.01 save/open/autosave recovery; numerical glow response checks. Live browser/GPU compilation, visual balance and performance have not been verified.
