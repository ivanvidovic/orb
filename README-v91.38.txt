ORB Garment Studio v91.38

Merge into your existing project, replacing matching files. Cumulative update based on v91.37.

Garment loading now transfers uniquely owned geometry instead of cloning it. Shared geometry or shared position/normal/tangent attributes still clone before transforms. Imported-material cleanup preserves transferred geometry. Evicted models release decoded image bitmaps as well as GPU textures, with ownership checks protecting images/textures still used by active or cached garments.

Desktop cache policy is separated from responsive layout detection: desktop touchscreen support and small browser windows no longer impose the one-model mobile cache limit. Phone/tablet detection retains the conservative mobile policy, including no background preloading and saving pending work before switches. Desktops retain up to four prepared garments. Preview resolution is unchanged. Library query handling and initial sample behavior are unchanged.

Verified using actual Three.js objects: exclusive geometry transfer, shared-geometry cloning, transferred geometry survives import cleanup, and shared texture/image resources remain live until no retained garment uses them. Device-policy cases and saved-session startup checks passed. JavaScript syntax, unrelated-file preservation and ZIP integrity checked. No on-device memory profiling or WebGL visual verification was available; mobile crash resolution still needs device testing. Old/new garment overlap remains during safe replacement.
