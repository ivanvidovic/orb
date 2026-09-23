# ORB v77: install and enable automatic libraries

This is an overlay for your existing ORB repository, not a replacement for its garment models or vendor files.

## One-time setup

1. Extract the ZIP on your computer. Upload its contents into the root of the **orb** repository on **main**, alongside the existing `index.html`. Merge the assets folders; keep your existing models and vendor files. Upload the extracted files, not the ZIP.
2. Make sure `scripts/build-libraries.py`, `assets/js/hosted-library.js`, and both `assets/libraries/orb/` and `assets/libraries/fireside/` are present.
3. Add the supplied workflow at exactly **`.github/workflows/orb-pages.yml`**. If the folder is not included by the file uploader, use **Add file → Create new file**, enter that full path, and paste the supplied YAML. Commit to main. Upload the workflow last, after the app, assets and build script.
4. Go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. No extra starter workflow is needed.
5. Open **Actions → Build and deploy ORB → Run workflow**, choose **main**, and run it. If the initial automatic run failed before you changed the Pages source, this manual run replaces it.
6. Wait for both **build** and **deploy** to turn green. Open the links below. If a job fails, send me the failed step's log before changing settings.

No personal access token or custom secrets are required. The workflow has read access to repository files and the permissions needed to publish Pages. It generates files in the build, without committing generated files back into your repository.

## Library links

- https://ivanvidovic.github.io/orb/?library=orb
- https://ivanvidovic.github.io/orb/?library=fireside

The existing design is preserved. Shared brand graphics join the artwork tray. Originals download on selection; thumbnails load first. Used originals are bundled in .orb files and artwork exports. Explicitly selecting Include library also downloads and bundles unused brand graphics. Background autosave does not download unused brand artwork.

## Add or update graphics

Upload PNG, JPG, WebP or SVG files into `assets/libraries/fireside/` or `assets/libraries/orb/`, then commit to main. Remove unwanted source images from that folder to remove them from the hosted library. Nested image folders also work.

Each push builds fresh manifests and previews automatically. Do not manually edit `manifest.json` or `_thumbnails`; the next build replaces those generated files. Previously saved designs retain their embedded originals.

To add a brand, create a lowercase folder such as `assets/libraries/kinship/`, add graphics, and commit. Once deployment completes, use `?library=kinship`. Names may contain lowercase letters, digits, hyphens and underscores. Filenames become display labels. Avoid uploading ZIPs into the brand folder: extract the graphics first.

SVG previews retain their vector source; raster previews are resized to at most 384 pixels. The full-resolution source files are unchanged.

## Other v77 changes

- Creative stage and projector shadow maps increase to 2048 on desktop; the secondary passing/charge light stays 1024. Mobile uses 1024. The main desktop directional shadow was already 2048 and stays there. Existing soft filtering and shadow-update throttling remain.
- Runway's overhead light moves physically. A second light travels across the garment, alternating front and back, with distance falloff and a fade at each end of its path. Activity, Pause, Flash intensity and Fix lights in scene remain available.
- Existing UI sizing and library cards are reused.

## Validation and limits

Checked library generation, content hashes, lazy loading, no unused background downloads, design preservation, original bytes in exports, explicit Include library, save/open recovery, lighting pause/zero intensity/preset transitions, passing-light clearance, mobile shadow sizes, and workflow structure.

GitHub deployment and live browser/GPU visuals and performance have not been verified. The workflow stages `index.html`, the entire `assets` directory, and CNAME if present. This matches this app's structure; other unrelated root pages are not published by this workflow.

GitHub workflow reference: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
