"""Generate public artwork manifests and small previews. Run from the repo root."""
from pathlib import Path
import hashlib, json, re, shutil
from PIL import Image, ImageOps
ROOT = Path(__file__).resolve().parents[1] / 'assets' / 'libraries'
SUPPORTED = {'.png', '.jpg', '.jpeg', '.webp', '.svg'}
def build(root=ROOT):
    if not root.exists():
        return
    for brand in sorted(root.iterdir()):
        if not brand.is_dir() or brand.name.startswith('.'):
            continue
        if not re.fullmatch(r'[a-z0-9][a-z0-9_-]{0,63}', brand.name):
            raise ValueError('Use a lowercase brand folder name: ' + brand.name)
        previews = brand / '_thumbnails'
        if previews.exists():
            shutil.rmtree(previews)
        previews.mkdir()
        assets = []
        for source in sorted(brand.rglob('*')):
            relative = source.relative_to(brand)
            if any(p.startswith(('.', '_')) for p in relative.parts) or not source.is_file() or source.suffix.lower() not in SUPPORTED:
                continue
            if source.is_symlink():
                raise ValueError('Library assets must be regular files: ' + str(source))
            digest = hashlib.sha256(source.read_bytes()).hexdigest()
            if any(a['id'] == 'asset-' + digest for a in assets):
                continue
            if source.suffix.lower() == '.svg':
                # SVGs are already vector previews; preserve their exact appearance.
                thumb = previews / (digest + '.svg')
                shutil.copyfile(source, thumb)
            else:
                thumb = previews / (digest + '.webp')
                with Image.open(source) as image:
                    image = ImageOps.exif_transpose(image).convert('RGBA')
                    image.thumbnail((384, 384), Image.Resampling.LANCZOS)
                    image.save(thumb, 'WEBP', quality=85, method=6)
            assets.append({'id':'asset-'+digest, 'name':source.stem, 'file':relative.as_posix(), 'thumbnail':thumb.relative_to(brand).as_posix()})
        data = {'version':1,'id':brand.name,'name':{'orb':'ORB'}.get(brand.name,brand.name.replace('-',' ').title()),'assets':assets}
        (brand / 'manifest.json').write_text(json.dumps(data, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
        print(f'{brand.name}: {len(assets)} graphics')
if __name__ == '__main__':
    build()
