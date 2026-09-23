# Bundled dependencies

- Three.js 0.160.0: https://github.com/mrdoob/three/tree/r160 (MIT; `three/LICENSE`).
- Draco decoder 1.5.6: https://github.com/google/draco/tree/1.5.6 (Apache 2.0; `draco/LICENSE`). Decoder binaries retrieved from Google's versioned 1.5.6 distribution.
- Rubik 300/400/500: Google Fonts v31, https://fonts.google.com/specimen/Rubik (SIL Open Font License; `rubik/OFL.txt`).

- ag-psd 27.0.0: https://github.com/Agamnentzar/ag-psd (MIT; `ag-psd/LICENSE`). Browser ESM writer bundled with esbuild 0.25.5 from `export {writePsdUint8Array,initializeCanvas} from 'ag-psd'`, using `--bundle --format=esm --platform=browser --minify`.
- The PSD writer includes pako 2.2.0 (MIT/Zlib; `ag-psd/pako-LICENSE`) and base64-js 1.5.1 (MIT; `ag-psd/base64-js-LICENSE`).

No dependency updates are performed at runtime.
