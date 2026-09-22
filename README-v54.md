# ORB Garment Studio 54

## Install
Extract this update over your existing ORB repository, replacing matching files. Keep existing garments and vendor assets. Publish and refresh. The guide footer should say ORB Studio 54. All previous updates are included.

## Start with a project folder
Drop a folder into the page or artwork library, or use Add folder. For example: Fireside / Full Back / Illustrations / artwork.svg. Review the detected folder groups and then click Add to library. Loose images dropped onto the garment still open the placement chooser.

The top project folder becomes the project label. Recognized placement folders restrict randomization to those placements. Type folders become tags. Unknown subfolder names become custom tags and appear in the review. Logos, Wordmarks, and Symbols without a placement folder suggest chest/sleeve spots; Illustrations and Textures suggest full front/back. Unclassified assets remain available manually but need placement rules before randomization.

## Curate the library
Filter by Project, Tag, or search. Use Tags & spots on an asset, or select several and Edit selected. Quick setup presets provide starting rules. Preferred is used in Curated and Explore, Allowed only in Explore, and Excluded never. Any position not listed as preferred or allowed is also excluded. Multi-edit's Keep existing preserves each asset's placement choice. Blank project/tag fields during multi-edit leave them unchanged; nonblank fields replace those lists.

Exact duplicate image files share one asset and combine imported metadata. Explicit exclusions take precedence. Removing an asset from the shelf does not delete placed layers.

## Generate variations
Randomize opens a small panel at the bottom right that leaves the garment accessible. Select current library filter, selected assets, or whole library; choose a layout and Curated or Explore. Auto chooses among viable layouts and specialty spots. Current placements reuses positions currently in the design. Unsupported garment placements and positions conflicting with a locked large graphic are skipped. Assets are not repeated unless enabled.

Randomize replaces all unlocked layers. Enable Keep this layer when randomizing in a layer's artwork controls to preserve it exactly. New graphics use source colors and restrained sizing; Explore adds modest size and position variation. Colors, garment, and lighting are not randomized. Each generation is one Undo step and supports Redo. If there are no compatible candidates, nothing changes. Randomization is for the built-in garments.

## Save
Project/tag/placement metadata and layer locks persist in browser recovery and .orb files. Enable Include unused library graphics when saving to carry the entire library to another browser. Open these files in v54 or later to retain the new metadata. Existing older designs are supported; their assets initially have no randomization rules.

## Limits and verification
Image imports accept up to 400 library assets, 50 MB per image, and 300 MB of live artwork. Folder review accepts up to 400 images; non-image files are skipped. Directory drops use browser directory-entry support; Add folder is the fallback. Imports that fail report filenames.

Checked all folder groups and exact placements, recursive multi-batch directory traversal, 1,000 random plans, exclusions, supported garments, locked-position conflicts, no repeats, Curated/Explore differences, UI event handlers with a DOM test harness, bulk editing, metadata/lock archive round trips and browser recovery, and actual layer-commit Undo/Redo. JavaScript syntax passed. Live browser/WebGL layout and interaction verification was unavailable.
