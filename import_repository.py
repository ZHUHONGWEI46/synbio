import zipfile
import json
from pathlib import Path

archive = Path('/Users/zhuhongwei/Downloads/NJTech-SynCAR-2026-main (2).zip')
destination = Path('assets/repository')
prefix = 'NJTech-SynCAR-2026-main/'
count = 0
with zipfile.ZipFile(archive) as source:
    for item in source.infolist():
        if item.is_dir() or not item.filename.startswith(prefix):
            continue
        relative = Path(item.filename[len(prefix):])
        if '..' in relative.parts or relative.is_absolute():
            raise ValueError('Invalid archive path')
        # Keep the supplied research submission intact, including linked evidence.
        if relative.parts[0] not in ('submission', 'results'):
            continue
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(source.read(item))
        count += 1
print(f'Imported {count} repository source files into {destination}')
(destination / 'files.json').write_text(json.dumps([str(path.relative_to(destination)) for path in destination.rglob('*') if path.is_file() and path.name != 'files.json'], ensure_ascii=False), encoding='utf-8')
