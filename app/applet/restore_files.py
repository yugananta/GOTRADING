import json
import os

with open('dist/server.cjs.map', 'r', encoding='utf-8') as f:
    data = json.load(f)

sources = data.get('sources', [])
sourcesContent = data.get('sourcesContent', [])

for src, content in zip(sources, sourcesContent):
    if content is not None:
        rel_path = src.replace('../', '')
        d = os.path.dirname(rel_path)
        if d:
            os.makedirs(d, exist_ok=True)
        with open(rel_path, 'w', encoding='utf-8') as out:
            out.write(content)
        print(f"Restored: {rel_path}")
