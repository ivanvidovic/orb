ORB Garment Studio v91.16 - Glow radiance and charging calibration

Merge into your existing ORB folder, replace matching files, then hard-refresh.
Cumulative v91 update; garment models and artwork assets are not included.

FIX
The corrected exposure capture in v91.15 was still feeding an emission gain
that was far too bright. Weak background illumination also charged the
long-lived reservoir too efficiently, flattening differences between sweeps.

- Recalibrated glow radiance so normal lighting dominates the material.
- Reduced charging from weak fill with a smooth exposure curve. Stronger
  exposures still accumulate, and repeated passes add to remaining charge.
- Charged ink still emits continuously, immediately visible in darkness.
  No darkness gate, reveal timer, visibility transition, or charge reset added.
- Fixed charge coordinates, normal capture, cross-preset history and the
  persistent decay tail from v91.15 are retained.
- Existing Glow intensity remains adjustable; UV fluorescence is unchanged.
- No additional render passes, targets or UI controls.

VALIDATION
Compared full production material shaders on a white ink test surface at
100% Glow intensity and maximum stored charge. With the same illumination,
linear output was 0.643 with Glow disabled, 2.293 under the old glow, and
0.743 under the revised glow. At zero illumination the new charged emission
was 0.100, while uncharged emission remained zero. This demonstrates a much
smaller effect under ordinary light, while retaining visible dark emission.

The shipped history shader passed accumulation, immediate emission and
120-second persistence checks using its RGBA8 fallback. Weak-fill charging
was also checked: at the selected dim exposure, ten-minute slow charge fell
from 0.664 to 0.071. JavaScript syntax and ZIP integrity passed.

Tests used local OpenGL ES and production shaders. Full ORB browser appearance
and hardware performance have not been verified in this run.
