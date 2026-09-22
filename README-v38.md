# ORB Garment Studio v38

Overlay these files on your existing app, preserving folders. Includes v37 fixes and v37.1 compact library labels. Models and existing vendor dependencies stay in place.

Export All now has Include artwork + originals, enabled by default:
- Artwork/: a separate transparent PNG for each layer, including hidden layers.
- Originals/: unchanged original source bytes, one copy per used asset.
- Artwork-reference.json: links each treated file to its source and records layer visibility, treatment, placement, glow and UV intent.
- Artwork-README.txt: handoff notes.

Original preserves colors and alpha; Tint uses the same linear-light shading calculation as the preview; Solid uses its selected color, Cutoff, Softness, Invert and existing alpha. The Solid coverage calculation is shared with the preview.

Treated output uses original raster dimensions, or SVG intrinsic raster dimensions, retaining source framing. It excludes garment transforms, fit trimming, fabric, lighting, gloss and emission. Originals retain their format; treated artwork is PNG. Animated originals are preserved while treated output is flattened. Assets over 32 million pixels or 16384 pixels on either edge are rejected rather than silently reduced; uncheck artwork to export mockups alone. Actual device canvas limits may be lower. Physical print dimensions and screen separations are not assigned.

Automated checks passed for full-resolution output above the preview limit, Solid color/alpha, Tint endpoints, Original preservation, per-layer files, original deduplication and byte preservation, reference metadata, cancellation, existing presentation export state restoration, and portable/browser saves. No live WebGL/browser visual verification was available.
