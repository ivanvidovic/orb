# ORB Garment Studio 45

Extract over the existing project and replace matching files. Keep garment and vendor assets. Publish and refresh; check ORB Studio 45 in the guide footer.

SVG uploads, library reuse, reopened designs, and treated artwork exports now share explicit high-resolution SVG decoding. Vector artwork is rendered at a 4096-pixel long edge, reduced when required by the preview device texture limit. Dimensions and viewBox proportions are respected. The original SVG bytes remain unchanged in designs and exported originals. PNG/JPG raster resolution handling is unchanged.

Your ORB_Center_Symbol.svg contains vector paths with a viewBox but no explicit pixel dimensions. The corrected source renders at 3669 x 4096, including for the treated PNG export. Refreshing rebuilds loaded artwork from saved originals; re-open your .orb file or re-add the SVG if an older preview remains.

Validated the supplied SVG with an XML-backed DOM adapter and native SVG rasterizer, inspected a rendered preview, checked transparency, GPU-size reduction, treated PNG dimensions, original byte preservation, alternative dimension formats, and existing raster artwork export checks. Live browser/WebGL visual verification was unavailable. The garment texture atlas still imposes finite resolution when zooming extremely close.

Includes prior calibration, city lighting, and expandable intensity changes.
