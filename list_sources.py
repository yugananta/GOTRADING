import json
with open('dist/server.cjs.map', 'r', encoding='utf-8') as f:
    data = json.load(f)
for src in data.get('sources', []):
    print(src)
