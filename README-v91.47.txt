ORB Garment Studio v91.47 — shadows and desktop preload

Merge into the existing site, replacing matching files; retain all other files. This cumulative patch includes v91.46.

Self-shadow depth and normal offsets now account for shadow-map resolution to reduce surface banding, retaining existing filtering, map sizes, geometry, textures, and glow calculations.

Desktop prepares garments sequentially after startup while idle and retains prepared models within a larger 2 GiB estimated cache budget (1 GiB on reported lower-memory desktops). Active garments are protected from eviction. Mobile still loads only the optimized men’s tee and performs no background garment preload.

Validated with source and automated behavior checks. Actual iPhone shadow appearance still requires device verification.
