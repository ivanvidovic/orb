# ORB Garment Studio 47

Extract over your existing project, replace matching files, publish and refresh.

Newly imported dark artwork on transparency now defaults to Invert on for Solid mode, regardless of SVG or raster format. Fully transparent pixels are ignored and visible colors are alpha-weighted. At least 1% fully transparent area and 90% dark visible coverage are required to choose inversion automatically. White, mixed, opaque, and empty artwork keep Invert off. Original and Tint behavior are unchanged.

Manual choices persist on layers and in saved designs. Existing saved layer choices are not retroactively changed. Artwork reset uses the detected default for new artwork.

Pixel classification checks and JavaScript syntax passed. Live browser verification was unavailable. Includes all previous updates.
