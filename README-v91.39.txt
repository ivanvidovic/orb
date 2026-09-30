ORB Garment Studio v91.39

Merge into your existing project, replacing matching files. Cumulative update based on v91.38.

Mobile Present (820px and below) removes the toolbar and drawer from layout, fixes the viewer container to the full viewport and disables container clipping. The WebGL render viewport/scissor uses the full window immediately while mobile Present is active. Exiting restores normal layout rules; desktop presentation interpolation is unchanged.

Verified render-rectangle logic for portrait, landscape, exit and desktop behavior; JavaScript syntax; unrelated-file preservation and ZIP integrity. Actual mobile WebGL appearance remains unverified.
